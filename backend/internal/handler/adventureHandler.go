package handler

import (
	"backend/internal/domain"
	"backend/internal/models"
	"errors"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AdventureHandler struct {
	Repo     domain.AdventureRepository
	CardRepo domain.CardRepository // Added this
}

// Update the constructor
func NewAdventureHandler(repo domain.AdventureRepository, cardRepo domain.CardRepository) *AdventureHandler {
	return &AdventureHandler{
		Repo:     repo,
		CardRepo: cardRepo,
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
		UserID:   userID,
		Name:     fmt.Sprintf("Adventure Level %d", req.Difficulty),
		Level:    req.Difficulty,
		Progress: 0,
		Cards:    cards, // GORM creates the many-to-many links here
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

func (h *AdventureHandler) EndAdventure(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := userIDVal.(uint)

	adventureID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid adventure ID"})
		return
	}

	// Pass BOTH IDs to the repository
	err = h.Repo.DeleteSecure(uint(adventureID), userID)

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// This now triggers if the ID is wrong OR if the user doesn't own it
			c.JSON(http.StatusForbidden, gin.H{"error": "Adventure not found or access denied"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Adventure ended successfully"})
}
