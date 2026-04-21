package domain

import (
	"backend/internal/models"
	"errors"
	"fmt"
	"log"

	"gorm.io/gorm"
)

type CardRepository interface {
	GetAll() ([]models.Card, error)
	GetByID(id uint) (*models.Card, error)
	GetByIDs(ids []uint) ([]models.Card, error)
	GetByUserID(userID uint) ([]models.Card, error)
	GetUserCards(userID uint) ([]models.UserCard, error)
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

func (r *gormCardRepo) GetUserCards(userID uint) ([]models.UserCard, error) {
	var userCards []models.UserCard
	// This fetches the UserCard entries, which include the specific instances of cards owned by the user
	err := r.DB.Preload("Card").Where("user_id = ?", userID).Find(&userCards).Error

	return userCards, err
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

		// Find the specific card copy owned by the user
		//if err := tx.Preload("Card.UpgradeTo").Where("id = ? AND user_id = ?", instanceID, userID).First(&userCard).Error; err != nil {
		//	return errors.New("card instance not found")
		//}

		if err := tx.Preload("Card").Where("id = ? AND user_id = ?", instanceID, userID).First(&userCard).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				log.Printf("Nie znaleziono karty instancji! Szukano: instanceID= %d userID= %d", instanceID, userID)
				return errors.New("card instance not found or doesn't belong to you")
			}
			return errors.New("database query error: " + err.Error())
		}

		if userCard.Card.UpgradeToID == nil {
			log.Printf("[UPGRADE] Karta %s (instance: %d) ma już maksymalny poziom.", userCard.Card.Name, instanceID)
			return errors.New("this card is already max level")
		}

		// Check User Money
		var user models.User
		if err := tx.First(&user, userID).Error; err != nil {
			return errors.New("nie udało się pobrać danych gracza")
		}

		tx.First(&user, userID)
		if user.Money < userCard.Card.UpgradeCost {
			return errors.New("poor gamer alert: insufficient funds")
		}

		// Deduct Money and Upgrade the Card
		if err := tx.Model(&user).Update("Money", user.Money-userCard.Card.UpgradeCost).Error; err != nil {
			return fmt.Errorf("błąd podczas pobierania opłaty: %w", err)
		}

		if err := tx.Model(&models.UserCard{}).Where("id = ?", instanceID).Update("card_id", *userCard.Card.UpgradeToID).Error; err != nil {
			return fmt.Errorf("błąd podczas ewolucji karty: %w", err)
		}

		log.Printf(" [UPGRADE] Sukces! Gracz %d ulepszył instancję %d z karty bazowej ID %d na kartę bazową ID %d",
			userID, instanceID, userCard.CardID, *userCard.Card.UpgradeToID)

		// Just update the CardID on this specific instance row!
		//return tx.Model(&userCard).Update("card_id", *userCard.Card.UpgradeToID).Error
		return nil
	})
}

// new VerifyUserOwnsCards that counts duplicates properly
func (r *gormCardRepo) VerifyUserOwnsCards(userID uint, requestedCardIDs []uint) error {
	// count how many of each card ID the user wants to take
	requiredCounts := make(map[uint]int)
	for _, id := range requestedCardIDs {
		requiredCounts[id]++
	}

	// fetch all UserCard entries for the user to see what they actually own
	var userCards []models.UserCard
	if err := r.DB.Where("user_id = ?", userID).Find(&userCards).Error; err != nil {
		return fmt.Errorf("błąd pobierania ekwipunku: %w", err)
	}

	// count how many of each card ID the user actually owns
	ownedCounts := make(map[uint]int)
	for _, uc := range userCards {
		ownedCounts[uc.CardID]++
	}

	// compare required counts with owned counts
	for cardID, requiredAmount := range requiredCounts {
		ownedAmount := ownedCounts[cardID]
		if ownedAmount < requiredAmount {
			return fmt.Errorf("brakuje karty bazowej o ID %d (chcesz wziąć: %d, a posiadasz tylko: %d)",
				cardID, requiredAmount, ownedAmount)
		}
	}
	return nil
}
