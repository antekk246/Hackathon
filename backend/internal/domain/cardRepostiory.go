package domain

import (
	"backend/internal/models"

	"gorm.io/gorm"
)

type CardRepository interface {
	GetAll() ([]models.Card, error)
	GetByID(id uint) (*models.Card, error)
	GetByType(typeName string) ([]models.Card, error)
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

func (r *gormCardRepo) GetByType(typeName string) ([]models.Card, error) {
	var cards []models.Card
	err := r.DB.Joins("JOIN card_types ON card_types.id = cards.type_id").
		Where("card_types.name = ?", typeName).
		Preload("Type").
		Find(&cards).Error
	return cards, err
}
