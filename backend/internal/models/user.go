package models

import (
	"time"
)

type User struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Username  string    `gorm:"uniqueIndex;not null" json:"username"`
	Email     string    `gorm:"uniqueIndex;not null" json:"email"`
	OAuthID   string    `gorm:"uniqueIndex" json:"oauth_id"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`

	Money uint `gorm:"not null" json:"money"`

	Cards []Card `gorm:"many2many:user_cards;" json:"cards"`

	Adventure *Adventure `json:"adventure,omitempty"`
}
