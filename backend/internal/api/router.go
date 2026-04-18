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

func SetupRouter(authH *handler.AuthHandler, advH *handler.AdventureHandler, cardH *handler.CardHandler) *gin.Engine {
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
			protected.GET("/", someFunc)
			protected.POST("/adventures", advH.StartAdventure)
			protected.GET("/adventures/active", advH.GetActiveAdventure)
			protected.DELETE("/adventures/:id", advH.EndAdventure)

			// Card routes
			cards := protected.Group("/cards")
			{
				cards.GET("", cardH.GetAllCards)
				cards.GET("/user", cardH.GetUserCards)
				cards.GET("/adventure/:id", cardH.GetAdventureCards)
				cards.POST("/:id/upgrade", cardH.Upgrade)
				cards.POST("/:id/buy", cardH.BuyCard)
			}
		}
	}

	return r
}
