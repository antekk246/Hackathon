package domain

import (
	"backend/internal/models"

	"gorm.io/gorm"
)

// The Interface (The contract)
type UserRepository interface {
	GetByEmail(email string) (*models.User, error)
}

// The Implementation
type postgresUserRepo struct {
	DB *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
	return &postgresUserRepo{DB: db}
}

func (r *postgresUserRepo) GetByEmail(email string) (*models.User, error) {
	var user models.User
	if err := r.DB.Where("email = ?", email).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}
