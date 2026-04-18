package domain

import (
	"backend/internal/models"

	"gorm.io/gorm"
)

type BuffRepository interface {
	GetAll() ([]models.Buff, error)
	GetByID(id uint) (*models.Buff, error)
}

type gormBuffRepo struct {
	DB *gorm.DB
}

func NewBuffRepository(db *gorm.DB) BuffRepository {
	return &gormBuffRepo{DB: db}
}

func (r *gormBuffRepo) GetAll() ([]models.Buff, error) {
	var buffs []models.Buff
	if err := r.DB.Find(&buffs).Error; err != nil {
		return nil, err
	}
	return buffs, nil
}

func (r *gormBuffRepo) GetByID(id uint) (*models.Buff, error) {
	var buff models.Buff
	if err := r.DB.First(&buff, id).Error; err != nil {
		return nil, err
	}
	return &buff, nil
}
