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
				// Zarządzanie cyklem życia przygody
				adventures.POST("", adventureH.StartAdventure)
				adventures.GET("/active", adventureH.GetActiveAdventure)
				adventures.POST("/end", adventureH.EndUsersAdventure)

				// Mechanika poruszania się po mapie
				adventures.GET("/room", adventureH.GetCurrentRoom)
				adventures.POST("/advance", adventureH.AdvanceRoom)
				adventures.POST("/play/:instanceID", adventureH.PlayCard)
				adventures.POST("/end-turn", adventureH.EndTurn)

				// --- NOWY ENDPOINT ---
				// Pobiera dynamiczny stan kart: Hand, Draw Pile, Discard Pile oraz HP/Manę
				adventures.GET("/room/state", adventureH.GetFullBattleState)
			}
			// GRUPA: Karty (Zarządzanie ekwipunkiem i ekonomią poza walką)
			cards := protected.Group("/cards")
			{
				// Przeglądanie zasobów
				cards.GET("/", cardH.GetAllCards)                    // Pobiera katalog wszystkich kart dostępnych w grze
				cards.GET("/user", cardH.GetUserCards)               // Pobiera prywatną kolekcję kart zalogowanego gracza
				cards.GET("/adventure/:id", cardH.GetAdventureCards) // Pobiera tylko te karty, które gracz zabrał na daną przygodę

				// id to numer instancj
				cards.POST("/:id/upgrade", cardH.Upgrade)
				cards.POST("/:id/buy", cardH.BuyCard) // Kupuje nową kartę i dodaje ją do kolekcji gracza
			}
		}
	}

	return r
}
