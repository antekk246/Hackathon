package models

import "gorm.io/datatypes"

type Fight struct {
	ID uint `gorm:"primaryKey" json:"id"`

	// card state management using json arrays of ids
	Cards       datatypes.JSON `json:"cards"`       // hand
	UsedCards   datatypes.JSON `json:"usedCards"`   // discard pile
	CardsInDeck datatypes.JSON `json:"cardsInDeck"` // draw pile

	// turn resources and state
	PlayerTurn     bool `json:"playerTurn"`
	DecisionPoints uint `json:"decisionPoints"`

	// combat vital stats
	CurrentPlayerHealth uint `json:"currentPlayerHealth"`
	CurrentPlayerShield uint `json:"currentPlayerShield"`
	CurrentEnemyHealth  uint `json:"currentEnemyHealth"`
	MaxEnemyHealth      uint `json:"maxEnemyHealth"`

	// relations
	EnemyID uint   `json:"enemyId"`
	Enemy   *Enemy `gorm:"foreignKey:EnemyID" json:"enemy,omitempty"`
}

type Enemy struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	IsBoss       bool           `json:"isBoss"`
	EnemyLevel   uint           `json:"enemyLevel"`
	BaseHealth   uint           `json:"baseHealth"`
	EnemyContent datatypes.JSON `json:"enemyContent"` // contains visual and move metadata
}

type Encounter struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	Level       uint   `json:"level"`
	IsBoss      bool   `json:"isBoss"`
	Description string `json:"description"`
	EnemyID     uint   `json:"enemyId"`
	Enemy       *Enemy `gorm:"foreignKey:EnemyID" json:"enemy,omitempty"`
}
