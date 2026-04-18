package models

import (
	"time"
)

type User struct {
	ID            uint   `gorm:"primaryKey" json:"id"`
	Username      string `gorm:"uniqueIndex;not null" json:"username"`
	Email         string `gorm:"uniqueIndex;not null" json:"email"`
	OAuthProvider string `json:"oauth_provider"` // e.g., "google"
	OAuthID       string `gorm:"uniqueIndex" json:"oauth_id"`

	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
