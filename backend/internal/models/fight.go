package models

import "gorm.io/datatypes"

// --- AKTYWNA SESJA (Konkretna walka gracza, tworzona w Create) ---

type Fight struct {
	ID uint `gorm:"primaryKey" json:"id"`

	// Stan talii gracza w trakcie tej konkretnej walki
	Cards       datatypes.JSON `json:"cards"`       // Karty na ręce (np. [1, 4, 7])
	UsedCards   datatypes.JSON `json:"usedCards"`   // Stos odrzuconych (discard pile)
	CardsInDeck datatypes.JSON `json:"cardsInDeck"` // Talia dobierania (draw pile)

	// Stan parametrów w trakcie tury
	PlayerTurn     bool `json:"playerTurn"`
	DecisionPoints uint `json:"decisionPoints"` // Mana/Akcje

	// ZDROWIE: Aktualny stan gracza i wroga
	CurrentPlayerHealth uint `json:"currentPlayerHealth"`
	CurrentPlayerShield uint `json:"currentPlayerShield"` // Nowa wartość dla tarczy
	CurrentEnemyHealth  uint `json:"currentEnemyHealth"`
	MaxEnemyHealth      uint `json:"maxEnemyHealth"`

	// Link do szablonu potwora (żeby frontend mógł pobrać jego nazwę, obrazek itp.)
	EnemyID uint   `json:"enemyId"`
	Enemy   *Enemy `gorm:"foreignKey:EnemyID" json:"enemy,omitempty"`
}

// --- SZABLONY (Wzorce do losowania, definiowane w seed.go) ---

type Enemy struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	IsBoss       bool           `json:"isBoss"`
	EnemyLevel   uint           `json:"enemyLevel"`
	BaseHealth   uint           `json:"baseHealth"`   // Ułatwia pobranie startowego HP!
	EnemyContent datatypes.JSON `json:"enemyContent"` // np. {"name": "Fałszywy SMS", "dmg": 40}
}

type Encounter struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	Level       uint   `json:"level"`
	IsBoss      bool   `json:"isBoss"`
	Description string `json:"description"` // np. "Zasadzka w ciemnym zaułku"
	EnemyID     uint   `json:"enemyId"`
	Enemy       *Enemy `gorm:"foreignKey:EnemyID" json:"enemy,omitempty"`
}
