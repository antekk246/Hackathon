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
				// Zarządzanie cyklem życia przygody
				adventures.POST("", adventureH.StartAdventure)           // Tworzy nową grę i generuje mapę
				adventures.GET("/active", adventureH.GetActiveAdventure) // Pobiera statystyki trwającej gry
				adventures.POST("/end", adventureH.EndUsersAdventure)    // Przerywa i usuwa obecną grę

				// Mechanika poruszania się po mapie
				adventures.GET("/room", adventureH.GetCurrentRoom)  // Pobiera pełne dane o obecnym pokoju (np. statystyki wroga)
				adventures.POST("/advance", adventureH.AdvanceRoom) // Przesuwa gracza do kolejnego pokoju (o ile obecny został oczyszczony)
			}

			// GRUPA: Karty (Zarządzanie ekwipunkiem i ekonomią poza walką)
			cards := protected.Group("/cards")
			{
				// Przeglądanie zasobów
				cards.GET("/", cardH.GetAllCards)                    // Pobiera katalog wszystkich kart dostępnych w grze
				cards.GET("/user", cardH.GetUserCards)               // Pobiera prywatną kolekcję kart zalogowanego gracza
				cards.GET("/adventure/:id", cardH.GetAdventureCards) // Pobiera tylko te karty, które gracz zabrał na daną przygodę

				// Akcje na konkretnych kartach (wymagają podania ID karty w adresie URL)
				cards.POST("/:id/upgrade", cardH.Upgrade) // Ulepsza posiadaną kartę (np. za wirtualne złoto)
				cards.POST("/:id/buy", cardH.BuyCard)     // Kupuje nową kartę i dodaje ją do kolekcji gracza
			}
		}
	}

	return r
}
