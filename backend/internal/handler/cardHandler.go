package handler

import (
	"net/http"
	"strconv"

	"backend/internal/domain"

	"github.com/gin-gonic/gin"
)

type CardHandler struct {
	CardRepo domain.CardRepository
	UserRepo domain.UserRepository
}

func NewCardHandler(cardRepo domain.CardRepository, userRepo domain.UserRepository) *CardHandler {
	return &CardHandler{
		CardRepo: cardRepo,
		UserRepo: userRepo, // If you forget this, h.UserRepo will be nil
	}
}

// GetAllCards - GET /api/v1/cards
func (h *CardHandler) GetAllCards(c *gin.Context) {
	cards, err := h.CardRepo.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch cards"})
		return
	}
	c.JSON(http.StatusOK, cards)
}

// GetUserCards - GET /api/v1/cards/user
// Uses the ID from the JWT token
func (h *CardHandler) GetUserCards(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	//cards, err := h.CardRepo.GetByUserID(userID.(uint))
	cards, err := h.CardRepo.GetUserCards(userID.(uint)) // This returns []UserCard with preloaded Card data
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user cards"})
		return
	}
	c.JSON(http.StatusOK, cards)
}

// GetAdventureCards - GET /api/v1/cards/adventure/:id
func (h *CardHandler) GetAdventureCards(c *gin.Context) {
	// 1. Get UserID from JWT (Middleware set this)
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// 2. Parse Adventure ID from URL
	idParam := c.Param("id")
	adventureID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid adventure ID"})
		return
	}

	// 3. Fetch cards (Passing both IDs for ownership validation)
	cards, err := h.CardRepo.GetByAdventureID(uint(adventureID), userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch adventure cards"})
		return
	}

	// 4. Handle Case: Adventure doesn't exist or doesn't belong to user
	// In GORM, if no records match the WHERE, it returns an empty slice and no error.
	if len(cards) == 0 {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied or adventure empty"})
		return
	}

	c.JSON(http.StatusOK, cards)
}
func (h *CardHandler) Upgrade(c *gin.Context) {
	// This ID is now the primary key from the 'user_cards' table
	instanceID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid instance ID"})
		return
	}

	userID := c.MustGet("userID").(uint)

	// Call the updated repository method
	if err := h.CardRepo.UpgradeCardInstance(userID, uint(instanceID)); err != nil {
		// We use 402 Payment Required for funds, or 400 for logic errors
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Specific card instance upgraded successfully",
	})
}

// BuyCard - POST /api/v1/cards/:id/buy
func (h *CardHandler) BuyCard(c *gin.Context) {
	cardIDParam := c.Param("id")
	cardID, err := strconv.ParseUint(cardIDParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid card ID"})
		return
	}

	userID := c.MustGet("userID").(uint)

	// Using UserRepo here - ensure it's injected into your handler
	if err := h.UserRepo.BuyCard(userID, uint(cardID)); err != nil {
		c.JSON(http.StatusPaymentRequired, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Card purchased successfully!"})
}
