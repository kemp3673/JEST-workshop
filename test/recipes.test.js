/* eslint-disable no-underscore-dangle */
/* eslint-disable no-undef */
const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../index');
const User = require('../database/models/users');
const mongoose = require('../database/dbConection');
const UserService = require('../database/services/users');
const RecipesService = require('../database/services/recipes');

let id;
let token;

describe('TEST RECIPES API', () => {
  beforeAll(async () => {
    // Create test user
    const password = bcrypt.hashSync('okay', 10);
    await User.create({
      username: 'admin',
      password,
    });
  });
  afterAll(async () => {
    await User.deleteMany();
    mongoose.disconnect();
  });
  // Test Login
  describe('POST/login', () => {
    it('Authenticates user and signs in', async () => {
      // DATA YOU WANT TO SAVE TO DB
      const user = {
        username: 'admin',
        password: 'okay',
      };
      const res = await request(app).post('/login').send(user);
      token = res.body.accessToken;
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          accessToken: res.body.accessToken,
          success: true,
          data: expect.objectContaining({
            id: res.body.data.id,
            username: res.body.data.username,
          }),
        }),
      );
    });
    it('Does not sign in, password field empty', async () => {
      // DATA YOU WANT TO SAVE TO DB
      const user = { username: 'admin' };
      const res = await request(app).post('/login').send(user);
      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'username or password can not be empty',
        }),
      );
    });
    it('does not sign in, username field empty', async () => {
      // DATA YOU WANT TO SAVE TO DB
      const user = { password: 'okay' };
      const res = await request(app).post('/login').send(user);
      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'username or password can not be empty',
        }),
      );
    });
    it('Does not sign in, username does not exist', async () => {
      // DATA YOU WANT TO SAVE TO DB
      const user = {
        username: 'chii',
        password: 'okay',
      };
      const res = await request(app).post('/login').send(user);
      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'Incorrect username or password',
        }),
      );
    });
    it('Does not sign in, password incorrect', async () => {
      // DATA YOU WANT TO SAVE TO DB
      const user = {
        username: 'admin',
        password: 'wrong',
      };
      const res = await request(app).post('/login').send(user);
      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'Incorrect username or password',
        }),
      );
    });
    it('Does not sign in, internal server error', async () => {
      // DATA YOU WANT TO SAVE TO DB
      const user = {
        username: 'admin',
        password: 'okay',
      };
      jest.spyOn(UserService, 'findByUsername').mockRejectedValueOnce(new Error());
      const res = await request(app).post('/login').send(user);
      expect(res.statusCode).toEqual(500);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'login failed.',
        }),
      );
    });
  });
  describe('POST/recipes', () => {
    it('Should save new recipe', async () => {
      // DATA YOU WANT TO SAVE TO DB
      const recipe = {
        name: 'chicken nuggets',
        difficulty: 2,
        vegetarian: true,
      };
      const res = await request(app).post('/recipes').send(recipe).set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(201);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: true,
          data: expect.any(Object),
        }),
      );
      id = res.body.data._id;
    });
    it('Should not save new recipe when name field is empty', async () => {
      // DATA YOU WANT TO SAVE TO DB
      const recipe = {
        difficulty: 2,
        vegetarian: true,
      };
      const res = await request(app).post('/recipes').send(recipe).set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'name field can not be empty',
        }),
      );
    });
    it('Should not save new recipe when difficulty field is empty', async () => {
      // DATA YOU WANT TO SAVE TO DB
      const recipe = {
        name: 'chicken nuggets',
        vegetarian: true,
      };
      const res = await request(app).post('/recipes').send(recipe).set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'difficulty field should be a number',
        }),
      );
    });
    it('Should not save new recipe when name difficulty field is invalid', async () => {
      // DATA YOU WANT TO SAVE TO DB
      const recipe = {
        name: 'chicken nuggets',
        difficulty: true,
        vegetarian: true,
      };
      const res = await request(app).post('/recipes').send(recipe).set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'difficulty field should be a number',
        }),
      );
    });
    it('Should not save new recipe when vegetarian boolean is empty', async () => {
      // DATA YOU WANT TO SAVE TO DB
      const recipe = {
        name: 'chicken nuggets',
        difficulty: 2,
      };
      const res = await request(app).post('/recipes').send(recipe).set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'vegetarian field should be boolean',
        }),
      );
    });
    it('Should not save new recipe when vegetarian field is invalid', async () => {
      // DATA YOU WANT TO SAVE TO DB
      const recipe = {
        name: 'chicken nuggets',
        difficulty: 2,
        vegetarian: 'true',
      };
      const res = await request(app).post('/recipes').send(recipe).set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'vegetarian field should be boolean',
        }),
      );
    });
    it('Should not save new recipe when token invalid', async () => {
      // DATA YOU WANT TO SAVE TO DB
      const recipe = {
        name: 'chicken nuggets',
        difficulty: 2,
        vegetarian: true,
      };
      const res = await request(app).post('/recipes').send(recipe).set('Authorization', `Bearer ${123}`);
      expect(res.statusCode).toEqual(403);
      expect(res.body).toEqual(
        expect.objectContaining({
          message: 'Unauthorized',
        }),
      );
    });
    it('Does not save, internal server error', async () => {
      // DATA YOU WANT TO SAVE TO DB
      const recipe = {
        name: 'chicken nuggets',
        difficulty: 2,
        vegetarian: true,
      };
      jest.spyOn(RecipesService, 'saveRecipes').mockRejectedValueOnce(new Error());
      const res = await request(app).post('/recipes').send(recipe).set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(500);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'Failed to save recipes!',
        }),
      );
    });
  });
  // Get recipes
  describe('GET/recipes', () => {
    it('Should retrieve all entries', async () => {
      const res = await request(app).get('/recipes').set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: true,
          data: expect.any(Object),
        }),
      );
    });
    it('Does not retrieve all recipes, internal server error', async () => {
      jest.spyOn(RecipesService, 'allRecipes').mockRejectedValueOnce(new Error());
      const res = await request(app).get('/recipes').set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(500);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'Some error occurred while retrieving recipes.',
        }),
      );
    });
  });
  describe('GET/recipes/:id', () => {
    it('Retrieves a specified entry in db', async () => {
      const res = await request(app).get(`/recipes/${id}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: true,
          data: expect.any(Object),
        }),
      );
    });
    it('Does not retrieve when id is invalid', async () => {
      const res = await request(app).get('/recipes/abc123');
      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'Recipe with id abc123 does not exist',
        }),
      );
    });
    it('Does not retrieves a specified entry in db, internal server error', async () => {
      jest.spyOn(RecipesService, 'fetchById').mockRejectedValueOnce(new Error());
      const res = await request(app).get(`/recipes/${id}`);
      expect(res.statusCode).toEqual(500);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'Some error occurred while retrieving recipe details.',
        }),
      );
    });
  });
  // TEST UPDATE RECIPE
  describe('PATCH/recipes/:id', () => {
    it('Updates recipe record in db', async () => {
      // DATA YOU WANT TO UPDATE
      const recipe = {
        name: 'chicken nuggets',
      };
      const res = await request(app).patch(`/recipes/${id}`).send(recipe).set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: true,
          data: expect.any(Object),
        }),
      );
    });
    it('Does not update, invalid difficulty value', async () => {
      // DATA YOU WANT TO UPDATE
      const recipe = {
        name: 'jollof rice',
        difficulty: '2',
      };
      const res = await request(app).patch(`/recipes/${id}`).send(recipe).set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'difficulty field should be a number',
        }),
      );
    });
    it('Does not update, invalid vegetarian value', async () => {
      // DATA YOU WANT TO UPDATE
      const recipe = {
        difficulty: 3,
        vegetarian: 'wrong',
      };
      const res = await request(app).patch(`/recipes/${id}`).send(recipe).set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'vegetarian field should be boolean',
        }),
      );
    });
    it('Does not update, invalid id', async () => {
      // DATA YOU WANT TO UPDATE
      const recipe = {
        difficulty: 3,
        vegetarian: true,
      };
      const res = await request(app).patch('/recipes/abc123').send(recipe).set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'Recipe with id abc123 does not exist',
        }),
      );
    });
    it('Does not update, invalid token', async () => {
      // DATA YOU WANT TO UPDATE
      const recipe = {
        difficulty: 3,
        vegetarian: true,
      };
      const res = await request(app).patch(`/recipes/${id}`).send(recipe).set('Authorization', 'Bearer 132456');
      expect(res.statusCode).toEqual(403);
      expect(res.body).toEqual(
        expect.objectContaining({
          message: 'Unauthorized',
        }),
      );
    });
    it('Should not update recipe in db, no update passed', async () => {
      const recipe = {};
      const res = await request(app).patch(`/recipes/${id}`).send(recipe).set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'field should not be empty',
        }),
      );
    });
    it('Does not update, internal server error', async () => {
      // DATA YOU WANT TO UPDATE
      const recipe = {
        name: 'chicken nuggets',
      };
      jest.spyOn(RecipesService, 'fetchByIdAndUpdate').mockRejectedValueOnce(new Error());
      const res = await request(app).patch(`/recipes/${id}`).send(recipe).set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(500);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'An error occured while updating recipe',
        }),
      );
    });
  });
  // TEST DELETE ENDPOINT
  describe('DELETE/recipes/:id', () => {
    it('Should DELETE recipe with valid id', async () => {
      const res = await request(app).delete(`/recipes/${id}`).set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: true,
          message: 'Recipe successfully deleted',
        }),
      );
    });
    it('Should not DELETE with invalid token', async () => {
      const res = await request(app).delete(`/recipes/${id}`).set('Authorization', 'Bearer 123abc');
      expect(res.statusCode).toEqual(403);
      expect(res.body).toEqual(
        expect.objectContaining({
          message: 'Unauthorized',
        }),
      );
    });
    it('Should not DELETE, internal server error', async () => {
      jest.spyOn(RecipesService, 'fetchByIdAndDelete').mockRejectedValueOnce(new Error());
      // const res = await request(app).delete(`/recipes/${id}`).set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(500);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'An error occured while deleting recipe',
        }),
      );
    });
  });
});
