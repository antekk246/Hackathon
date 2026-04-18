package handler

import (
	"backend/internal/domain"
	"backend/internal/models"
	"errors"
	"fmt"
	"net/http"

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
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reset adventure"})
			return
		}
	}

	// 4. Create the Adventure
	// We map the IDs into the model slice. GORM uses the IDs to link existing cards.
	cards := make([]models.Card, len(req.CardIDs))
	for i, id := range req.CardIDs {
		cards[i] = models.Card{ID: id}
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start adventure"})
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
}
