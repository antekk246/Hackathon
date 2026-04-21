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
			authProtected := protected.Group("/auth")
			{
				authProtected.GET("/me", authH.GetMe)
			}
			// Adventure routes
			adventures := protected.Group("/adventures")
			{
				//adventure lifecycle management
				adventures.POST("", adventureH.StartAdventure)
				adventures.GET("/active", adventureH.GetActiveAdventure)
				adventures.POST("/end", adventureH.EndUsersAdventure)
				// adventure progression and actions
				adventures.GET("/room", adventureH.GetCurrentRoom)
				adventures.POST("/advance", adventureH.AdvanceRoom)
				adventures.POST("/play/:instanceID", adventureH.PlayCard)
				adventures.POST("/end-turn", adventureH.EndTurn)
				adventures.POST("/start-turn", adventureH.StartTurn)

				// adventure state and info
				adventures.GET("/room/state", adventureH.GetFullBattleState)
			}
			// Card routes
			cards := protected.Group("/cards")
			{
				//
				cards.GET("/", cardH.GetAllCards)
				cards.GET("/user", cardH.GetUserCards)
				cards.GET("/adventure/:id", cardH.GetAdventureCards)
				// id is the instance ID of the card in the adventure, not the base card ID
				cards.POST("/:id/upgrade", cardH.Upgrade)
				cards.POST("/:id/buy", cardH.BuyCard)
			}
		}
	}

	return r
}
