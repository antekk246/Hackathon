package domain

import (
	"backend/internal/models"
	"fmt"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type UserRepository interface {
	GetByEmail(email string) (*models.User, error)
	GetByOAuthID(oauthID string) (*models.User, error)
	Create(user *models.User) error
	BuyCard(userID uint, cardID uint) error
}

type gormUserRepo struct {
	DB *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
	return &gormUserRepo{DB: db}
}

func (r *gormUserRepo) GetByEmail(email string) (*models.User, error) {
	var user models.User
	if err := r.DB.Where("email = ?", email).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *gormUserRepo) GetByOAuthID(oauthID string) (*models.User, error) {
	var user models.User
	// Preload Adventure and Adventure.Buffs (nested preload)
	if err := r.DB.Preload("Cards").Preload("Adventure.Buffs").Where("o_auth_id = ?", oauthID).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}
func (r *gormUserRepo) BuyCard(userID uint, cardID uint) error {
	return r.DB.Transaction(func(tx *gorm.DB) error {
		var user models.User
		var card models.Card

		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&user, userID).Error; err != nil {
			return err
		}
		if err := tx.First(&card, cardID).Error; err != nil {
			return err
		}

		if user.Money < card.UpgradeCost { // Or card.Price
			return fmt.Errorf("insufficient funds")
		}

		// 1. Deduct Money
		tx.Model(&user).Update("money", user.Money-card.UpgradeCost)

		// 2. Add a NEW instance to the inventory
		userCard := models.UserCard{
			UserID: userID,
			CardID: cardID,
		}
		return tx.Create(&userCard).Error
	})
}
func (r *gormUserRepo) Create(user *models.User) error {
	return r.DB.Create(user).Error
}
