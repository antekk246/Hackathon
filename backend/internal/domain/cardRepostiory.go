package domain

import (
	"backend/internal/models"
	"errors"
	"fmt"

	"gorm.io/gorm"
)

type CardRepository interface {
	GetAll() ([]models.Card, error)
	GetByID(id uint) (*models.Card, error)
	GetByIDs(ids []uint) ([]models.Card, error)
	GetByUserID(userID uint) ([]models.Card, error)
	GetByAdventureID(adventureID uint, userID uint) ([]models.Card, error)
	UpgradeCardInstance(userID uint, instanceID uint) error
	VerifyUserOwnsCards(userID uint, cardIDs []uint) error
	GetCardsMapByIDs(ids []uint) (map[uint]models.Card, error)
}

type gormCardRepo struct {
	DB *gorm.DB
}

func NewCardRepository(db *gorm.DB) CardRepository {
	return &gormCardRepo{DB: db}
}
func (r *gormCardRepo) GetCardsMapByIDs(ids []uint) (map[uint]models.Card, error) {
	var cards []models.Card
	if err := r.DB.Where("id IN ?", ids).Find(&cards).Error; err != nil {
		return nil, err
	}

	cardMap := make(map[uint]models.Card)
	for _, card := range cards {
		cardMap[card.ID] = card
	}
	return cardMap, nil
}
func (r *gormCardRepo) GetByIDs(ids []uint) ([]models.Card, error) {
	var cards []models.Card
	// This fetches all card details for the IDs provided
	err := r.DB.Where("id IN ?", ids).Find(&cards).Error
	return cards, err
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

// Change the signature to use instanceID (UserCard.ID)
func (r *gormCardRepo) UpgradeCardInstance(userID uint, instanceID uint) error {
	return r.DB.Transaction(func(tx *gorm.DB) error {
		var userCard models.UserCard

		// 1. Find the specific card copy owned by the user
		//if err := tx.Preload("Card.UpgradeTo").Where("id = ? AND user_id = ?", instanceID, userID).First(&userCard).Error; err != nil {
		//	return errors.New("card instance not found")
		//}

		// Zmień ten fragment w UpgradeCardInstance:
		if err := tx.Preload("Card.UpgradeTo").Where("id = ? AND user_id = ?", instanceID, userID).First(&userCard).Error; err != nil {
			// Sprawdzamy, czy to faktycznie brak rekordu, czy inny błąd (np. błąd SQL lub relacji)
			if errors.Is(err, gorm.ErrRecordNotFound) {
				// Możesz dodać logowanie, żeby zobaczyć jakich ID szukał:
				errors.New("Nie znaleziono karty instancji! Szukano: instanceID= " + fmt.Sprint(instanceID) + " userID=" + fmt.Sprint(userID))
				return errors.New("card instance not found or doesn't belong to you")
			}
			// Jeśli to inny błąd GORMa (np. problem z Preload), zwróćmy go, żeby go zobaczyć!
			return errors.New("database query error: " + err.Error())
		}

		if userCard.Card.UpgradeToID == nil {
			return errors.New("this card is already max level")
		}

		// 2. Check User Money
		var user models.User
		tx.First(&user, userID)
		if user.Money < userCard.Card.UpgradeCost {
			return errors.New("poor gamer alert: insufficient funds")
		}

		// 3. Process Upgrade
		tx.Model(&user).Update("money", user.Money-userCard.Card.UpgradeCost)

		// Just update the CardID on this specific instance row!
		return tx.Model(&userCard).Update("card_id", *userCard.Card.UpgradeToID).Error
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
