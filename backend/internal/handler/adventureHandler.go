package handler

import (
	"backend/internal/domain"
	"backend/internal/models"
	"encoding/json"
	"errors"
	"fmt"
	"math/rand"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AdventureHandler struct {
	Repo     domain.AdventureRepository
	CardRepo domain.CardRepository
	RoomRepo domain.RoomRepository
}

func NewAdventureHandler(repo domain.AdventureRepository, cardRepo domain.CardRepository, roomRepo domain.RoomRepository) *AdventureHandler {
	return &AdventureHandler{
		Repo:     repo,
		CardRepo: cardRepo,
		RoomRepo: roomRepo,
	}
}

type StartAdventureRequest struct {
	Difficulty uint   `json:"difficulty" binding:"required"`
	CardIDs    []uint `json:"cardIds" binding:"required"`
	Force      bool   `json:"force"`
}

func (h *AdventureHandler) StartAdventure(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := userIDVal.(uint)

	var req StartAdventureRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// validate required card count per difficulty
	var requiredCount int
	switch req.Difficulty {
	case 1:
		requiredCount = 10
	case 2:
		requiredCount = 12
	case 3:
		requiredCount = 15
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Difficulty must be 1, 2, or 3"})
		return
	}

	if len(req.CardIDs) != requiredCount {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": fmt.Sprintf("Level %d requires exactly %d cards, but %d were provided",
				req.Difficulty, requiredCount, len(req.CardIDs)),
		})
		return
	}

	// verify user owns selected cards
	if err := h.CardRepo.VerifyUserOwnsCards(userID, req.CardIDs); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Ownership verification failed: " + err.Error()})
		return
	}

	// check and handle active adventure conflicts
	existing, err := h.Repo.GetByUserID(userID)
	if err == nil && existing != nil {
		if !req.Force {
			c.JSON(http.StatusConflict, gin.H{
				"error": "Active adventure already exists",
				"code":  "ADVENTURE_EXISTS",
			})
			return
		}
		if err := h.Repo.DeleteByUserID(userID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reset adventure: " + err.Error()})
			return
		}
	}

	cards, err := h.CardRepo.GetByIDs(req.CardIDs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch cards: " + err.Error()})
		return
	}

	newAdventure := models.Adventure{
		UserID:       userID,
		Name:         fmt.Sprintf("Adventure Level %d", req.Difficulty),
		Level:        req.Difficulty,
		Progress:     0,
		PlayerHealth: 900,
		Cards:        cards,
	}

	if err := h.Repo.Create(&newAdventure); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start adventure: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, newAdventure)
}

func (h *AdventureHandler) GetActiveAdventure(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := userIDVal.(uint)

	adventure, err := h.Repo.GetByUserID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "No active adventure found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	c.JSON(http.StatusOK, adventure)
}

func (h *AdventureHandler) EndUsersAdventure(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := userIDVal.(uint)

	err := h.Repo.DeleteByUserID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "No active adventure found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Adventure ended successfully"})
}

func (h *AdventureHandler) GetCurrentRoom(c *gin.Context) {
	userIDVal, _ := c.Get("userID")
	userID := userIDVal.(uint)

	adventure, err := h.Repo.GetByUserID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No active adventure found"})
		return
	}

	room, err := h.RoomRepo.GetRoomWithDetails(adventure.CurrentRoomID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load room details"})
		return
	}

	c.JSON(http.StatusOK, room)
}

func (h *AdventureHandler) AdvanceRoom(c *gin.Context) {
	userIDVal, _ := c.Get("userID")
	userID := userIDVal.(uint)

	adventure, err := h.Repo.GetByUserID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No active adventure found"})
		return
	}

	currentRoom, err := h.RoomRepo.GetRoomWithDetails(adventure.CurrentRoomID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify current room"})
		return
	}

	// prevent skipping uncleared rooms
	if !currentRoom.IsCleared {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "You must complete the current room before advancing.",
			"code":  "ROOM_NOT_CLEARED",
		})
		return
	}

	// handle victory condition
	if currentRoom.NextRoomID == nil {
		_ = h.Repo.DeleteByUserID(userID)
		c.JSON(http.StatusOK, gin.H{
			"status":  "victory",
			"message": "Congratulations! You have completed the adventure.",
		})
		return
	}

	adventure.CurrentRoomID = *currentRoom.NextRoomID
	adventure.Progress += 1

	if err := h.Repo.Update(adventure); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to move to next room"})
		return
	}

	newRoom, _ := h.RoomRepo.GetRoomWithDetails(adventure.CurrentRoomID)
	c.JSON(http.StatusOK, gin.H{
		"status": "advanced",
		"room":   newRoom,
	})
}

func (h *AdventureHandler) GetFullBattleState(c *gin.Context) {
	userID := c.MustGet("userID").(uint)

	adventure, err := h.Repo.GetByUserID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No active adventure found"})
		return
	}

	room, err := h.RoomRepo.GetRoomWithDetails(adventure.CurrentRoomID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load room details"})
		return
	}

	// map fight room state
	if room.Type == "fight" && room.Fight != nil {
		var handIDs, deckIDs, usedIDs []uint

		json.Unmarshal(room.Fight.Cards, &handIDs)
		json.Unmarshal(room.Fight.CardsInDeck, &deckIDs)
		json.Unmarshal(room.Fight.UsedCards, &usedIDs)

		allIDs := uniqueIDs(append(append(handIDs, deckIDs...), usedIDs...))
		cardMap, err := h.CardRepo.GetCardsMapByIDs(allIDs)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch card details"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"room_type": "fight",
			"hand":      mapIDsToCards(handIDs, cardMap),
			"draw":      mapIDsToCards(deckIDs, cardMap),
			"discard":   mapIDsToCards(usedIDs, cardMap),
			"stats": gin.H{
				"player_hp":     room.Fight.CurrentPlayerHealth,
				"player_shield": room.Fight.CurrentPlayerShield,
				"enemy_hp":      room.Fight.CurrentEnemyHealth,
				"enemy_max_hp":  room.Fight.MaxEnemyHealth,
				"mana":          room.Fight.DecisionPoints,
				"player_turn":   room.Fight.PlayerTurn,
			},
		})
		return
	}

	// map event room choices
	if room.Type == "event" && room.Event != nil {
		var handIDs []uint
		json.Unmarshal(room.Event.CardsOnHand, &handIDs)

		cards, _ := h.CardRepo.GetByIDs(handIDs)
		c.JSON(http.StatusOK, gin.H{
			"room_type": "event",
			"hand":      cards,
			"message":   "Event room - choose an action",
		})
		return
	}

	c.JSON(http.StatusBadRequest, gin.H{"error": "Room state unavailable"})
}

func (h *AdventureHandler) PlayCard(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	instanceID, _ := strconv.ParseUint(c.Param("instanceID"), 10, 32)

	adv, err := h.Repo.GetByUserID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No active adventure"})
		return
	}

	room, err := h.RoomRepo.GetRoomWithDetails(adv.CurrentRoomID)
	if err != nil || room.Fight == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Battle context not found"})
		return
	}

	card, err := h.CardRepo.GetByID(uint(instanceID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Card data missing"})
		return
	}

	var action map[string]interface{}
	if err := json.Unmarshal(card.CardAction, &action); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid card action format"})
		return
	}

	// validate energy cost
	cardCost := 1
	if customCost, ok := action["cost"].(float64); ok {
		cardCost = int(customCost)
	}

	if room.Fight.DecisionPoints < uint(cardCost) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not enough energy to play this card"})
		return
	}

	if !room.Fight.PlayerTurn {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not your turn"})
		return
	}

	// execute card mechanics
	actionType, _ := action["action"].(string)
	switch actionType {
	case "damage":
		if val, ok := action["value"].(float64); ok {
			h.applyDamage(room.Fight, uint(val))
		}
	case "block":
		if val, ok := action["value"].(float64); ok {
			room.Fight.CurrentPlayerShield += uint(val)
		}
	case "draw":
		if val, ok := action["value"].(float64); ok {
			h.handleDraw(room.Fight, int(val))
		}
	case "multi":
		if dmg, ok := action["dmg"].(float64); ok {
			h.applyDamage(room.Fight, uint(dmg))
		} else if dmg2, ok := action["damage"].(float64); ok {
			h.applyDamage(room.Fight, uint(dmg2))
		}
		if blk, ok := action["block"].(float64); ok {
			room.Fight.CurrentPlayerShield += uint(blk)
		}
		if eng, ok := action["energy"].(float64); ok {
			room.Fight.DecisionPoints += uint(eng)
		}
	case "execute":
		if val, ok := action["value"].(float64); ok {
			enemyBefore := room.Fight.CurrentEnemyHealth
			h.applyDamage(room.Fight, uint(val))
			if enemyBefore > 0 && room.Fight.CurrentEnemyHealth == 0 {
				h.handleDraw(room.Fight, 1)
			}
		}
	}

	// finalize card usage
	room.Fight.DecisionPoints -= uint(cardCost)
	h.moveCardToDiscard(room.Fight, uint(instanceID))

	if err := h.RoomRepo.UpdateFight(room.Fight); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save turn"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":        "success",
		"enemy_hp":      room.Fight.CurrentEnemyHealth,
		"player_hp":     room.Fight.CurrentPlayerHealth,
		"player_shield": room.Fight.CurrentPlayerShield,
		"actions":       room.Fight.DecisionPoints,
	})
}

func (h *AdventureHandler) applyDamage(fight *models.Fight, damage uint) {
	if damage >= fight.CurrentEnemyHealth {
		fight.CurrentEnemyHealth = 0
	} else {
		fight.CurrentEnemyHealth -= damage
	}
}

func (h *AdventureHandler) moveCardToDiscard(fight *models.Fight, cardID uint) {
	var hand, discard []uint
	json.Unmarshal(fight.Cards, &hand)
	json.Unmarshal(fight.UsedCards, &discard)

	for i, id := range hand {
		if id == cardID {
			hand = append(hand[:i], hand[i+1:]...)
			break
		}
	}

	discard = append(discard, cardID)
	fight.Cards, _ = json.Marshal(hand)
	fight.UsedCards, _ = json.Marshal(discard)
}

func (h *AdventureHandler) handleDraw(fight *models.Fight, count int) {
	var hand, deck, discard []uint
	json.Unmarshal(fight.Cards, &hand)
	json.Unmarshal(fight.CardsInDeck, &deck)
	json.Unmarshal(fight.UsedCards, &discard)

	for i := 0; i < count; i++ {
		// reshuffle if deck is empty
		if len(deck) == 0 {
			if len(discard) == 0 {
				break
			}
			deck = make([]uint, len(discard))
			copy(deck, discard)
			discard = []uint{}

			rand.Seed(time.Now().UnixNano())
			rand.Shuffle(len(deck), func(i, j int) {
				deck[i], deck[j] = deck[j], deck[i]
			})
		}

		if len(deck) > 0 {
			cardToDraw := deck[0]
			deck = deck[1:]
			hand = append(hand, cardToDraw)
		}
	}

	fight.Cards, _ = json.Marshal(hand)
	fight.CardsInDeck, _ = json.Marshal(deck)
	fight.UsedCards, _ = json.Marshal(discard)
}

func (h *AdventureHandler) StartTurn(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	adv, _ := h.Repo.GetByUserID(userID)
	room, _ := h.RoomRepo.GetRoomWithDetails(adv.CurrentRoomID)
	fight := room.Fight

	fight.DecisionPoints = 2
	fight.PlayerTurn = true

	h.handleDraw(fight, 4)

	h.RoomRepo.UpdateFight(fight)
	c.JSON(http.StatusOK, gin.H{"message": "Turn started, cards drawn"})
}

func (h *AdventureHandler) EndTurn(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	adv, _ := h.Repo.GetByUserID(userID)
	room, _ := h.RoomRepo.GetRoomWithDetails(adv.CurrentRoomID)
	fight := room.Fight

	var hand, discard []uint
	json.Unmarshal(fight.Cards, &hand)
	json.Unmarshal(fight.UsedCards, &discard)

	discard = append(discard, hand...)
	fight.UsedCards, _ = json.Marshal(discard)
	fight.Cards, _ = json.Marshal([]uint{})

	// basic enemy attack logic
	if fight.CurrentPlayerHealth > 100 {
		fight.CurrentPlayerHealth -= 100
	} else {
		fight.CurrentPlayerHealth = 0
	}

	fight.PlayerTurn = false

	h.RoomRepo.UpdateFight(fight)
	c.JSON(http.StatusOK, gin.H{
		"message":   "Enemy dealt 100 damage",
		"player_hp": fight.CurrentPlayerHealth,
	})
}

func mapIDsToCards(ids []uint, cardMap map[uint]models.Card) []models.Card {
	result := make([]models.Card, 0, len(ids))
	for _, id := range ids {
		if card, exists := cardMap[id]; exists {
			result = append(result, card)
		}
	}
	return result
}

func uniqueIDs(ids []uint) []uint {
	m := make(map[uint]bool)
	var result []uint
	for _, id := range ids {
		if !m[id] {
			m[id] = true
			result = append(result, id)
		}
	}
	return result
}
