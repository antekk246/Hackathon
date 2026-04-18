package api

import (
	"backend/internal/handler"
	"backend/internal/middleware"
	"net/http"

	"github.com/gin-gonic/gin"
)

func someFunc(c *gin.Context) {
	userID, _ := c.Get("userID")

	c.JSON(http.StatusOK, gin.H{
		"message": "Welcome!",
		"your_id": userID,
	})
}

func HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "up",
		"message": "Server is running!",
	})
}

func SetupRouter(authH *handler.AuthHandler, adventureH *handler.AdventureHandler, cardH *handler.CardHandler) *gin.Engine {
	r := gin.Default()
	r.GET("/ping", HealthCheck)
	v1 := r.Group("/api/v1")
	{
		//public routes
		auth := v1.Group("/auth")
		{
			// Replaces password login
			auth.GET("/google/login", authH.GoogleLogin)
			auth.GET("/google/callback", authH.GoogleCallback)
		}

		//protected routes
		protected := v1.Group("/")
		protected.Use(middleware.JWTAuth())
		{
			// Adventure routes
			adventures := protected.Group("/adventures")
			{
				adventures.POST("", adventureH.StartAdventure)
				adventures.GET("/active", adventureH.GetActiveAdventure)
				adventures.POST("/end", adventureH.EndUsersAdventure)
			}
			// Card routes
			cards := protected.Group("/cards")
			{
				cards.GET("/", cardH.GetAllCards)                    // GET /api/v1/cards
				cards.GET("/user", cardH.GetUserCards)               // GET /api/v1/cards/user
				cards.GET("/adventure/:id", cardH.GetAdventureCards) // GET /api/v1/cards/adventure/1
				cards.POST("/:id/upgrade", cardH.Upgrade)            // POST /api/v1/cards/1/upgrade
				cards.POST("/:id/buy", cardH.BuyCard)
			}
		}
	}

	return r
}
