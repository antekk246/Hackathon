package handler

import (
	"backend/internal/domain"
	"backend/internal/models"
	"backend/pkg/jwtutil"
	"encoding/json"
	"errors"
	"net/http"
	"os"

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

func (h *AuthHandler) GoogleLogin(c *gin.Context) {
	url := h.OauthConfig.AuthCodeURL("random_state_string")
	c.Redirect(http.StatusTemporaryRedirect, url)
}

func (h *AuthHandler) GoogleCallback(c *gin.Context) {
	code := c.Query("code")
	token, err := h.OauthConfig.Exchange(c, code)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "code exchange failed"})
		return
	}

	client := h.OauthConfig.Client(c, token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v3/userinfo")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch user info"})
		return
	}
	defer resp.Body.Close()

	var googleUser struct {
		Sub   string `json:"sub"`
		Email string `json:"email"`
		Name  string `json:"name"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&googleUser); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to decode user info"})
		return
	}

	user, err := h.UserRepo.GetByOAuthID(googleUser.Sub)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// create new user if not found
			user = &models.User{
				Username: googleUser.Name,
				Email:    googleUser.Email,
				OAuthID:  googleUser.Sub,
				Money:    900,
			}

			if err := h.UserRepo.Create(user); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "user creation failed"})
				return
			}
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
			return
		}
	}

	appToken, err := jwtutil.GenerateToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "token generation failed"})
		return
	}

	// determine frontend redirect url based on environment
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = c.Request.Header.Get("Origin")
	}
	if frontendURL == "" {
		frontendURL = "http://localhost:5173"
	}

	redirectURL := frontendURL + "/?token=" + appToken
	c.Redirect(http.StatusTemporaryRedirect, redirectURL)
}

func (h *AuthHandler) GetMe(c *gin.Context) {
	val, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	// handle type assertion for various jwt id formats
	var userID uint
	switch v := val.(type) {
	case uint:
		userID = v
	case float64:
		userID = uint(v)
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid user id format"})
		return
	}

	user, err := h.UserRepo.GetByID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}
