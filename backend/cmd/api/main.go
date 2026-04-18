package main

import (
	"backend/internal/api"
	"backend/internal/handler"
	"fmt"
	"log"
)

func main() {
	fmt.Println("Starting API server...")
	authHandler := handler.NewAuthHandler(nil)
	fmt.Println("managed auth handler")
	r := api.SetupRouter(authHandler)

	log.Println("Server starting on :8080...")
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
