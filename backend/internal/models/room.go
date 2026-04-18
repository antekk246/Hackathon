package models

type Room struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	Type        string `json:"type"` // e.g., "fight", "event"
	AdventureID uint   `gorm:"not null;index" json:"adventureId"`
	// Linking logic
	NextRoomID *uint `json:"nextRoomId"`
	NextRoom   *Room `gorm:"foreignKey:NextRoomID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"nextRoom,omitempty"`

	IsCleared bool `json:"isCleared"`
	// Content: Only one of these should be non-nil per room
	FightID *uint  `json:"fightId,omitempty"`
	Fight   *Fight `json:"fight,omitempty"`

	// If you add Events later:
	EventID *uint  `json:"eventId,omitempty"`
	Event   *Event `json:"event,omitempty"`
}
