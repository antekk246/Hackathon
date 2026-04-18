package handler

import (
	"backend/internal/domain"
	"backend/internal/models"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AdventureHandler struct {
	Repo domain.AdventureRepository
}

func NewAdventureHandler(repo domain.AdventureRepository) *AdventureHandler {
	return &AdventureHandler{Repo: repo}
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

	// 1. Check difficulty (1, 2, 3)
	if req.Difficulty < 1 || req.Difficulty > 3 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Difficulty must be 1, 2, or 3"})
		return
	}

	// 2. Check if user has exactly 10 cards
	if len(req.CardIDs) != 10 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "You must select exactly 10 cards"})
		return
	}

	// 3. Check for existing adventure
	existing, err := h.Repo.GetByUserID(userID)
	if err == nil && existing != nil {
		if !req.Force {
			c.JSON(http.StatusConflict, gin.H{
				"error":   "Active adventure already exists",
				"message": "Do you want to end the current adventure and start a new one?",
				"code":    "ADVENTURE_EXISTS",
			})
			return
		}

		// Delete existing adventure if force=true
		if err := h.Repo.DeleteByUserID(userID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete existing adventure"})
			return
		}
	} else if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// 4. Create new adventure
	cards := make([]models.Card, len(req.CardIDs))
	for i, id := range req.CardIDs {
		cards[i] = models.Card{ID: id}
	}

	newAdventure := models.Adventure{
		UserID:   userID,
		Name:     "Nowa Przygoda",
		Level:    req.Difficulty,
		Progress: 0,
		Cards:    cards,
	}

	if err := h.Repo.Create(&newAdventure); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create adventure"})
		return
	}

	c.JSON(http.StatusCreated, newAdventure)
}
