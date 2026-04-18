package domain

import (
	"backend/internal/models"
	"fmt"

	"gorm.io/gorm"
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

		// 1. Fetch user and card with a lock to prevent race conditions
		if err := tx.Set("gorm:query_option", "FOR UPDATE").First(&user, userID).Error; err != nil {
			return err
		}

		// We assume the card price is stored in the Card model (e.g., as 'BuyPrice' or 'UpgradeCost')
		// For this example, let's assume cards have a 'Price' field.
		if err := tx.First(&card, cardID).Error; err != nil {
			return err
		}

		// 2. Check if user already owns the card (optional, if you want unique cards only)
		var count int64
		tx.Table("user_cards").Where("user_id = ? AND card_id = ?", userID, cardID).Count(&count)
		if count > 0 {
			return fmt.Errorf("you already own the %s card", card.Name)
		}

		// 3. Check funds (using UpgradeCost as the base price, or add a Price field to Card)
		// Adjust "UpgradeCost" to whatever field represents the store price
		price := card.UpgradeCost
		if user.Money < price {
			return fmt.Errorf("insufficient money: need %d, have %d", price, user.Money)
		}

		// 4. Deduct Money
		if err := tx.Model(&user).Update("money", user.Money-price).Error; err != nil {
			return err
		}

		// 5. Add Card to User
		if err := tx.Exec("INSERT INTO user_cards (user_id, card_id) VALUES (?, ?)", userID, cardID).Error; err != nil {
			return err
		}

		return nil
	})
}
func (r *gormUserRepo) Create(user *models.User) error {
	return r.DB.Create(user).Error
}
