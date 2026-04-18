package api

import (
	"backend/internal/handler"
	"backend/internal/middleware"
	"net/http"

	"github.com/gin-gonic/gin"
)

func someFunc(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "You made it to the protected area!"})
}
func HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "up",
		"message": "Server is running!",
	})
}

func SetupRouter(authH *handler.AuthHandler) *gin.Engine {
	r := gin.Default()
	r.GET("/ping", HealthCheck)
	v1 := r.Group("/api/v1")
	{
		//public routes
		auth := v1.Group("/auth")
		{
			auth.POST("/login", authH.Login)
			// auth.POST("/register", authH.Register)
		}

		//protected routes
		protected := v1.Group("/")
		protected.Use(middleware.JWTAuth())
		{
			protected.GET("/", someFunc)
		}
	}

	return r
}
