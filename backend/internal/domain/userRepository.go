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
	GetByID(id uint) (*models.User, error)
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
	return r.DB.Transaction(func(tx *gorm.DB) error {
		// 1. Create the user first to get the generated ID
		if err := tx.Create(user).Error; err != nil {
			return err
		}

		// 2. Prepare the initial cards (IDs 1-10)
		var userCards []models.UserCard
		for i := uint(1); i <= 10; i++ {
			userCards = append(userCards, models.UserCard{
				UserID: user.ID, // user.ID is now populated after tx.Create
				CardID: i,
			})
		}

		// 3. Bulk insert the relation records
		if err := tx.Create(&userCards).Error; err != nil {
			return err
		}

		return nil
	})
}

func (r *gormUserRepo) GetByID(id uint) (*models.User, error) {
	var user models.User
	// Preloadujemy karty i przygodę, aby /me zwracało pełny stan gracza
	err := r.DB.Preload("Cards").
		Preload("Adventure").
		First(&user, id).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}
