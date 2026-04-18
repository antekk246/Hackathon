package domain

import (
	"backend/internal/models"

	"gorm.io/gorm"
)

// 1. The Interface
type RoomRepository interface {
	GetRoomWithDetails(roomID uint) (*models.Room, error)
}

// 2. The Struct Definition (This must match your method receiver!)
type roomRepo struct {
	db *gorm.DB
}

// 3. The Constructor (Used in your main.go to wire up the handler)
func NewRoomRepository(db *gorm.DB) RoomRepository {
	return &roomRepo{
		db: db,
	}
}

// 4. The Method
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
