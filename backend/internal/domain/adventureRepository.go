package domain

import (
	"backend/internal/models"

	"gorm.io/gorm"
)

type AdventureRepository interface {
	GetByID(id uint) (*models.Adventure, error)
	GetByUserID(userID uint) (*models.Adventure, error)
	Create(adventure *models.Adventure) error
	Update(adventure *models.Adventure) error
	DeleteSecure(id uint, userID uint) error
	DeleteByUserID(userID uint) error
}

type gormAdventureRepo struct {
	DB *gorm.DB
}

func NewAdventureRepository(db *gorm.DB) AdventureRepository {
	return &gormAdventureRepo{DB: db}
}

func (r *gormAdventureRepo) GetByID(id uint) (*models.Adventure, error) {
	var adventure models.Adventure
	if err := r.DB.Preload("Buffs").Preload("Cards").First(&adventure, id).Error; err != nil {
		return nil, err
	}
	return &adventure, nil
}

func (r *gormAdventureRepo) GetByUserID(userID uint) (*models.Adventure, error) {
	var adventure models.Adventure
	// Preload("Buffs") automatically fetches the many-to-many relationship
	if err := r.DB.Preload("Buffs").Preload("Cards").Where("user_id = ?", userID).First(&adventure).Error; err != nil {
		return nil, err
	}
	return &adventure, nil
}

func (r *gormAdventureRepo) Create(adventure *models.Adventure) error {
	return r.DB.Create(adventure).Error
}

func (r *gormAdventureRepo) Update(adventure *models.Adventure) error {
	return r.DB.Save(adventure).Error
}

func (r *gormAdventureRepo) DeleteSecure(adventureID uint, userID uint) error {
	// This only deletes if BOTH the ID and the UserID match
	result := r.DB.Where("id = ? AND user_id = ?", adventureID, userID).Delete(&models.Adventure{})

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}

	return nil
}
func (r *gormAdventureRepo) DeleteByUserID(userID uint) error {
	return r.DB.Where("user_id = ?", userID).Delete(&models.Adventure{}).Error
}
