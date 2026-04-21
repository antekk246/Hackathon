package domain

import (
	"backend/internal/models"

	"gorm.io/gorm"
)

type RoomRepository interface {
	GetRoomWithDetails(roomID uint) (*models.Room, error)
	UpdateFight(fight *models.Fight) error
}

type roomRepo struct {
	db *gorm.DB
}

func NewRoomRepository(db *gorm.DB) RoomRepository {
	return &roomRepo{
		db: db,
	}
}

// method
func (r *roomRepo) GetRoomWithDetails(roomID uint) (*models.Room, error) {
	var room models.Room
	err := r.db.
		Preload("Fight").
		Preload("Fight.Enemy").
		Preload("Event").
		Preload("Event.Reward").
		First(&room, roomID).Error

	return &room, err
}
func (r *roomRepo) UpdateFight(fight *models.Fight) error {
	return r.db.Save(fight).Error
}
