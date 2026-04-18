package domain

import (
	"backend/internal/models"

	"gorm.io/gorm"
)

type AdventureRepository interface {
	GetByUserID(userID uint) (*models.Adventure, error)
	Create(adventure *models.Adventure) error
	Update(adventure *models.Adventure) error
	Delete(id uint) error
	DeleteByUserID(userID uint) error
}

type gormAdventureRepo struct {
	DB *gorm.DB
}

func NewAdventureRepository(db *gorm.DB) AdventureRepository {
	return &gormAdventureRepo{DB: db}
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

func (r *gormAdventureRepo) Delete(id uint) error {
	return r.DB.Delete(&models.Adventure{}, id).Error
}

func (r *gormAdventureRepo) DeleteByUserID(userID uint) error {
	return r.DB.Where("user_id = ?", userID).Delete(&models.Adventure{}).Error
}
