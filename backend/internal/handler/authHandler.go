package handler

import (
	"backend/internal/domain"
	"backend/internal/models"
	"backend/pkg/jwtutil"
	"encoding/json"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/oauth2"
	"gorm.io/gorm"
)

type AuthHandler struct {
	UserRepo    domain.UserRepository
	OauthConfig *oauth2.Config
}

func NewAuthHandler(repo domain.UserRepository, config *oauth2.Config) *AuthHandler {
	return &AuthHandler{
		UserRepo:    repo,
		OauthConfig: config,
	}
}

// User hits /api/v1/auth/google/login
func (h *AuthHandler) GoogleLogin(c *gin.Context) {
	url := h.OauthConfig.AuthCodeURL("random_state_string")
	c.Redirect(http.StatusTemporaryRedirect, url)
}
func (h *AuthHandler) GoogleCallback(c *gin.Context) {
	code := c.Query("code")
	token, err := h.OauthConfig.Exchange(c, code)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Błąd wymiany kodu"})
		return
	}

	// user data fetch
	client := h.OauthConfig.Client(c, token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v3/userinfo")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Błąd pobierania danych użytkownika"})
		return
	}
	defer resp.Body.Close()

	var googleUser struct {
		Sub   string `json:"sub"`
		Email string `json:"email"`
		Name  string `json:"name"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&googleUser); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Błąd dekodowania danych użytkownika"})
		return
	}

	user, err := h.UserRepo.GetByOAuthID(googleUser.Sub)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Only create if they actually don't exist
			user = &models.User{ /* ... */ }
			h.UserRepo.Create(user)
		} else {
			// If it's a real DB error (like connection lost), don't try to create a user
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
			return
		}
	}

	// Generujemy Wasz token JWT
	appToken, err := jwtutil.GenerateToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Token generation failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": appToken,
		"user":  user,
	})
}
