package models

import "gorm.io/datatypes"

type Event struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	CardsOnHand datatypes.JSON `json:"cardsOnHand"`

	// Use a uint for the foreign key, not datatypes.JSON
	RewardID *uint   `json:"rewardId"`
	Reward   *Reward `gorm:"foreignKey:RewardID" json:"reward,omitempty"`
}

type Reward struct {
	ID uint `gorm:"primaryKey" json:"id"`
	// This JSON can hold complex data like { "gold": 100, "item_id": 5 }
	RewardContent datatypes.JSON `json:"rewardContent"`
	RewardLevel   uint           `json:"rewardLevel"`
}
