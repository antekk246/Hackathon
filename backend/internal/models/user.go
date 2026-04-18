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

	Cards     []UserCard `gorm:"foreignKey:UserID" json:"inventory"`
	Adventure *Adventure `json:"adventure,omitempty"`
}

type UserCard struct {
	ID     uint `gorm:"primaryKey" json:"instanceId"`
	UserID uint `gorm:"index" json:"userId"`
	CardID uint `gorm:"index" json:"cardId"`
	Card   Card `gorm:"foreignKey:CardID" json:"card"`
}

func (UserCard) TableName() string {
	return "user_cards"
}
