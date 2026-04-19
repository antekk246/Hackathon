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
	Force      bool   `json:"force"` // if true, delete existing adventure
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

	// 1. Level-based Card Count Validation
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

	// 2. Ownership Security Check
	// Call the method we added to the CardRepository earlier
	if err := h.CardRepo.VerifyUserOwnsCards(userID, req.CardIDs); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Ownership verification failed: " + err.Error()})
		return
	}

	// 3. Handle Conflict with Existing Adventure
	existing, err := h.Repo.GetByUserID(userID)
	if err == nil && existing != nil {
		if !req.Force {
			c.JSON(http.StatusConflict, gin.H{
				"error": "Active adventure already exists",
				"code":  "ADVENTURE_EXISTS",
			})
			return
		}
		// Force delete
		if err := h.Repo.DeleteByUserID(userID); err != nil {
			// INCLUDE THE ERROR HERE:

			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reset adventure: " + err.Error()})
			return
		}
	}

	// 4. Create the Adventure
	// We map the IDs into the model slice. GORM uses the IDs to link existing cards.
	//cards := make([]models.Card, len(req.CardIDs))
	//for i, id := range req.CardIDs {
	//	cards[i] = models.Card{ID: id}
	//}
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
		Cards:        cards, // GORM creates the many-to-many links here
	}

	if err := h.Repo.Create(&newAdventure); err != nil {
		// INCLUDE THE ERROR HERE:
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start adventure: " + err.Error() + "with cards: " + fmt.Sprint(cards)})
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

// GetCurrentRoom returns the fully populated data for the player's current location
func (h *AdventureHandler) GetCurrentRoom(c *gin.Context) {
	userIDVal, _ := c.Get("userID")
	userID := userIDVal.(uint)

	// 1. Get the active adventure
	adventure, err := h.Repo.GetByUserID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No active adventure found"})
		return
	}

	// 2. Fetch the room using the Adventure's CurrentRoomID
	room, err := h.RoomRepo.GetRoomWithDetails(adventure.CurrentRoomID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load room details"})
		return
	}

	c.JSON(http.StatusOK, room)
}

// AdvanceRoom moves the player to the next node on the map
func (h *AdventureHandler) AdvanceRoom(c *gin.Context) {
	userIDVal, _ := c.Get("userID")
	userID := userIDVal.(uint)

	// 1. Get the active adventure
	adventure, err := h.Repo.GetByUserID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No active adventure found"})
		return
	}

	// 2. Fetch the current room to verify it's cleared
	currentRoom, err := h.RoomRepo.GetRoomWithDetails(adventure.CurrentRoomID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify current room"})
		return
	}

	// 3. SECURITY CHECK: Ensure the room is actually cleared before advancing
	if !currentRoom.IsCleared {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "You must complete the current room before advancing.",
			"code":  "ROOM_NOT_CLEARED",
		})
		return
	}

	// 4. Check for victory condition (NextRoomID is nil)
	if currentRoom.NextRoomID == nil {
		// Run complete! End the adventure.
		_ = h.Repo.DeleteByUserID(userID)

		c.JSON(http.StatusOK, gin.H{
			"status":  "victory",
			"message": "Congratulations! You have completed the adventure.",
		})
		return
	}

	// 5. Update the Adventure progress
	adventure.CurrentRoomID = *currentRoom.NextRoomID
	adventure.Progress += 1

	if err := h.Repo.Update(adventure); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to move to next room"})
		return
	}

	// 6. Fetch and return the new room
	newRoom, _ := h.RoomRepo.GetRoomWithDetails(adventure.CurrentRoomID)
	c.JSON(http.StatusOK, gin.H{
		"status": "advanced",
		"room":   newRoom,
	})
} // GetFullBattleState - GET /api/v1/adventures/room/state
func (h *AdventureHandler) GetFullBattleState(c *gin.Context) {
	userID := c.MustGet("userID").(uint)

	// 1. Fetch active adventure
	adventure, err := h.Repo.GetByUserID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No active adventure found"})
		return
	}

	// 2. Fetch current room details (including Fight/Event data)
	room, err := h.RoomRepo.GetRoomWithDetails(adventure.CurrentRoomID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load room details"})
		return
	}

	// 3. Logic for FIGHT rooms
	if room.Type == "fight" && room.Fight != nil {
		var handIDs, deckIDs, usedIDs []uint

		// Unmarshal the JSON arrays from the database
		json.Unmarshal(room.Fight.Cards, &handIDs)
		json.Unmarshal(room.Fight.CardsInDeck, &deckIDs)
		json.Unmarshal(room.Fight.UsedCards, &usedIDs)

		// Combine all IDs to fetch details in one single DB query
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
				"player_hp":    room.Fight.CurrentPlayerHealth,
				"enemy_hp":     room.Fight.CurrentEnemyHealth,
				"enemy_max_hp": room.Fight.MaxEnemyHealth,
				"mana":         room.Fight.DecisionPoints,
				"player_turn":  room.Fight.PlayerTurn,
			},
		})
		return
	}

	// 4. Logic for EVENT rooms (simpler, usually just a "hand" of choices)
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

	// 1. Pobierz metadane karty
	card, err := h.CardRepo.GetByID(uint(instanceID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Card data missing"})
		return
	}

	// 2. Sparsuj JSON akcji
	var action map[string]interface{}
	if err := json.Unmarshal(card.CardAction, &action); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid card action format"})
		return
	}

	// 3. --- WALIDACJA KOSZTU (Naprawa błędu z energią) ---
	cardCost := 1 // domyślnie 1
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

	// 4. --- LOGIKA OBRAŻEŃ (Naprawa zadawania damage) ---
	actionType, _ := action["action"].(string)

	switch actionType {
	case "damage":
		// Ważne: GORM/JSON używa float64 dla liczb, trzeba rzutować na uint
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
		// Obsługa hybryd: damage, block, energy
		if dmg, ok := action["dmg"].(float64); ok { // sprawdzamy klucz 'dmg' ze starszego seeda
			h.applyDamage(room.Fight, uint(dmg))
		} else if dmg2, ok := action["damage"].(float64); ok { // lub 'damage' z nowszego
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

	// 5. Finalizacja
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

// Funkcja pomocnicza dla czytelności kodu
func (h *AdventureHandler) applyDamage(fight *models.Fight, damage uint) {
	if damage >= fight.CurrentEnemyHealth {
		fight.CurrentEnemyHealth = 0
	} else {
		fight.CurrentEnemyHealth -= damage
	}
}
func (h *AdventureHandler) moveCardToDiscard(fight *models.Fight, cardID uint) {
	var hand []uint
	var discard []uint
	json.Unmarshal(fight.Cards, &hand)
	json.Unmarshal(fight.UsedCards, &discard)

	// Find and remove from hand
	for i, id := range hand {
		if id == cardID {
			hand = append(hand[:i], hand[i+1:]...)
			break
		}
	}

	// Add to discard pile
	discard = append(discard, cardID)

	// Re-marshal back to JSON
	fight.Cards, _ = json.Marshal(hand)
	fight.UsedCards, _ = json.Marshal(discard)
}
func (h *AdventureHandler) handleDraw(fight *models.Fight, count int) {
	var hand, deck, discard []uint
	json.Unmarshal(fight.Cards, &hand)
	json.Unmarshal(fight.CardsInDeck, &deck)
	json.Unmarshal(fight.UsedCards, &discard)

	for i := 0; i < count; i++ {
		if len(deck) == 0 {
			if len(discard) == 0 {
				break // No cards left anywhere
			}

			//Copy discard to deck and reset discard
			deck = make([]uint, len(discard))
			copy(deck, discard)
			discard = []uint{}

			// Shuffle the new deck
			rand.Seed(time.Now().UnixNano())
			rand.Shuffle(len(deck), func(i, j int) {
				deck[i], deck[j] = deck[j], deck[i]
			})
		}

		// Draw the top card
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

// StartTurn - POST /api/v1/adventures/start-turn
func (h *AdventureHandler) StartTurn(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	adv, _ := h.Repo.GetByUserID(userID)
	room, _ := h.RoomRepo.GetRoomWithDetails(adv.CurrentRoomID)
	fight := room.Fight

	//Reset Resources
	fight.DecisionPoints = 2
	fight.PlayerTurn = true

	//Draw 4 cards (automatically shuffles if needed)
	h.handleDraw(fight, 4)

	h.RoomRepo.UpdateFight(fight)
	c.JSON(http.StatusOK, gin.H{"message": "Turn started, cards drawn"})
}

// EndTurn - POST /api/v1/adventures/end-turn
func (h *AdventureHandler) EndTurn(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	adv, _ := h.Repo.GetByUserID(userID)
	room, _ := h.RoomRepo.GetRoomWithDetails(adv.CurrentRoomID)
	fight := room.Fight

	// 1. Discard current hand
	var hand, discard []uint
	json.Unmarshal(fight.Cards, &hand)
	json.Unmarshal(fight.UsedCards, &discard)

	discard = append(discard, hand...)
	fight.UsedCards, _ = json.Marshal(discard)
	fight.Cards, _ = json.Marshal([]uint{}) // UI sees empty hand

	// 2. Enemy Attack: Deal 100 Damage
	if fight.CurrentPlayerHealth > 100 {
		fight.CurrentPlayerHealth -= 100
	} else {
		fight.CurrentPlayerHealth = 0
	}

	// 3. End Player Turn
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
