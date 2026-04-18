package domain

import (
	"backend/internal/models"
	"errors"

	"golang.org/x/crypto/bcrypt"
)

type MockUserRepo struct{}

func (m *MockUserRepo) GetByEmail(email string) (*models.User, error) {
	// Let's "hardcode" a user for testing
	// Password is "password123"
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)

	if email == "test@example.com" {
		return &models.User{
			ID:       1,
			Email:    "test@example.com",
			Password: string(hashedPassword),
		}, nil
	}

	return nil, errors.New("user not found")
}
