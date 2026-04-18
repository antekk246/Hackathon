package domain

import (
	"backend/internal/models"
	"errors"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type CardRepository interface {
	GetAll() ([]models.Card, error)
	GetByID(id uint) (*models.Card, error)
	GetByUserID(userID uint) ([]models.Card, error)
	GetByAdventureID(adventureID uint, userID uint) ([]models.Card, error)
	UpgradeCardForUser(userID uint, cardID uint) error
	VerifyUserOwnsCards(userID uint, cardIDs []uint) error
}

type gormCardRepo struct {
	DB *gorm.DB
}

func NewCardRepository(db *gorm.DB) CardRepository {
	return &gormCardRepo{DB: db}
}

func (r *gormCardRepo) GetAll() ([]models.Card, error) {
	var cards []models.Card
	// Preload both Type and the recursive UpgradeTo relationship
	if err := r.DB.Preload("Type").Preload("UpgradeTo").Find(&cards).Error; err != nil {
		return nil, err
	}
	return cards, nil
}

func (r *gormCardRepo) GetByID(id uint) (*models.Card, error) {
	var card models.Card
	if err := r.DB.Preload("Type").Preload("UpgradeTo").First(&card, id).Error; err != nil {
		return nil, err
	}
	return &card, nil
}

func (r *gormCardRepo) GetByUserID(userID uint) ([]models.Card, error) {
	var cards []models.Card
	// This joins the many-to-many table 'user_cards'
	err := r.DB.Joins("JOIN user_cards ON user_cards.card_id = cards.id").
		Where("user_cards.user_id = ?", userID).
		Preload("Type").
		Find(&cards).Error
	return cards, err
}

func (r *gormCardRepo) GetByAdventureID(adventureID uint, userID uint) ([]models.Card, error) {
	var cards []models.Card

	// We join adventures to ensure the adventure belongs to the user
	err := r.DB.Joins("JOIN user_cards ON user_cards.card_id = cards.id").
		Joins("JOIN adventures ON adventures.user_id = user_cards.user_id").
		Where("adventures.id = ? AND adventures.user_id = ?", adventureID, userID).
		Preload("Type").
		Find(&cards).Error

	return cards, err
}
func (r *gormCardRepo) UpgradeCardForUser(userID uint, cardID uint) error {
	return r.DB.Transaction(func(tx *gorm.DB) error {
		var user models.User
		var card models.Card

		// 1. Fetch user and card with locking to prevent race conditions
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&user, userID).Error; err != nil {
			return err
		}
		if err := tx.Preload("UpgradeTo").First(&card, cardID).Error; err != nil {
			return err
		}

		// 2. Validate: Does the card have an upgrade?
		if card.UpgradeToID == nil {
			return errors.New("this card cannot be upgraded")
		}

		// 3. Validate: Does the user own the card?
		var count int64
		tx.Table("user_cards").Where("user_id = ? AND card_id = ?", userID, cardID).Count(&count)
		if count == 0 {
			return errors.New("user does not own this card")
		}

		// 4. Validate: Does user have enough money?
		if user.Money < card.UpgradeCost {
			return errors.New("insufficient funds")
		}

		// 5. Deduct Money
		if err := tx.Model(&user).Update("money", user.Money-card.UpgradeCost).Error; err != nil {
			return err
		}

		// 6. Swap the cards in the join table
		// Remove old card
		if err := tx.Exec("DELETE FROM user_cards WHERE user_id = ? AND card_id = ?", userID, cardID).Error; err != nil {
			return err
		}
		// Add new card
		if err := tx.Exec("INSERT INTO user_cards (user_id, card_id) VALUES (?, ?)", userID, *card.UpgradeToID).Error; err != nil {
			return err
		}

		return nil
	})
}
func (r *gormCardRepo) VerifyUserOwnsCards(userID uint, cardIDs []uint) error {
	var count int64
	// Check the join table for user ownership
	err := r.DB.Table("user_cards").
		Where("user_id = ? AND card_id IN ?", userID, cardIDs).
		Count(&count).Error

	if err != nil {
		return err
	}
	if count != int64(len(cardIDs)) {
		return errors.New("one or more cards are not owned by the user")
	}
	return nil
}
