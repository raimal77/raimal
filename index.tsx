/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

interface Expense {
  id: number;
  description: string;
  amount: number;
  category: string;
}

const App: React.FC = () => {
  // Auth State
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // App State
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [insights, setInsights] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Effect to check for a logged-in user on component mount
  useEffect(() => {
    const loggedInUser = localStorage.getItem('app_currentUser');
    if (loggedInUser) {
      setCurrentUser(JSON.parse(loggedInUser));
    }
  }, []);

  // Effect to load user's expenses when they log in
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('app_currentUser', JSON.stringify(currentUser));
      const allExpenses = JSON.parse(localStorage.getItem('app_expenses') || '{}');
      setExpenses(allExpenses[currentUser] || []);
    } else {
      localStorage.removeItem('app_currentUser');
      setExpenses([]);
    }
    // Reset app state on user change
    setInsights(null);
    setError(null);
  }, [currentUser]);
  
  // Effect to save expenses to localStorage whenever they change
  useEffect(() => {
    if (currentUser) {
      const allExpenses = JSON.parse(localStorage.getItem('app_expenses') || '{}');
      allExpenses[currentUser] = expenses;
      localStorage.setItem('app_expenses', JSON.stringify(allExpenses));
    }
  }, [expenses, currentUser]);

  const totalExpenses = useMemo(() => {
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  }, [expenses]);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNumber = parseFloat(amount);
    if (!description.trim() || isNaN(amountNumber) || amountNumber <= 0) {
      alert('Please enter a valid description and amount.');
      return;
    }

    const newExpense: Expense = {
      id: Date.now(),
      description,
      amount: amountNumber,
      category,
    };

    setExpenses([...expenses, newExpense]);
    setDescription('');
    setAmount('');
    setCategory('Food');
  };

  const handleDeleteExpense = (id: number) => {
    setExpenses(expenses.filter(expense => expense.id !== id));
  };

  const handleGetInsights = async () => {
    if (expenses.length === 0) {
      setError("Please add some expenses before getting insights.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setInsights(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const prompt = `You are a helpful financial assistant. Analyze the following list of expenses and provide a brief summary of spending habits, identify the top spending category, and offer 2-3 actionable tips for saving money. Format the response clearly. Expenses: ${JSON.stringify(expenses.map(({description, amount, category}) => ({description, amount, category})))}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      
      setInsights(response.text);

    } catch (err) {
      console.error(err);
      setError('Failed to generate insights. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderInsights = () => {
    if (!insights) return null;
    return insights.split('\n').map((paragraph, index) => (
      paragraph.trim() && <p key={index}>{paragraph}</p>
    ));
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const users = JSON.parse(localStorage.getItem('app_users') || '{}');
    if (users[email]) {
      setAuthError('User with this email already exists.');
      return;
    }
    // NOTE: In a real app, never store passwords in plaintext. Always hash them.
    users[email] = password;
    localStorage.setItem('app_users', JSON.stringify(users));

    const allExpenses = JSON.parse(localStorage.getItem('app_expenses') || '{}');
    allExpenses[email] = [];
    localStorage.setItem('app_expenses', JSON.stringify(allExpenses));

    setCurrentUser(email);
  };
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const users = JSON.parse(localStorage.getItem('app_users') || '{}');
    if (users[email] && users[email] === password) {
      setCurrentUser(email);
    } else {
      setAuthError('Invalid email or password.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setEmail('');
    setPassword('');
  };

  // Render Auth view if no user is logged in
  if (!currentUser) {
    return (
      <div className="auth-container">
        <h1>AI Expense Tracker</h1>
        <div className="form-card auth-card">
          <h2>{authView === 'login' ? 'Login' : 'Register'}</h2>
          <form onSubmit={authView === 'login' ? handleLogin : handleRegister} className="auth-form">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              aria-label="Email"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              aria-label="Password"
              required
            />
            {authError && <p className="auth-error" role="alert">{authError}</p>}
            <button type="submit" className="auth-button">
              {authView === 'login' ? 'Login' : 'Register'}
            </button>
          </form>
          <p className="auth-toggle">
            {authView === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => { setAuthView(authView === 'login' ? 'register' : 'login'); setAuthError(null); }}>
              {authView === 'login' ? 'Register' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Render main app if user is logged in
  return (
    <main className="container">
      <header className="app-header">
        <p className="user-info">Logged in as <strong>{currentUser}</strong></p>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </header>

      <h1>AI Expense Tracker</h1>
      <p className="subtitle">Track your spending and get smart financial insights.</p>

      <section className="summary-card">
        <h2>Total Expenses</h2>
        <p className="total-amount">${totalExpenses.toFixed(2)}</p>
      </section>

      <section className="form-card">
        <h3>Add New Expense</h3>
        <form onSubmit={handleAddExpense} className="expense-form">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Expense description (e.g., Coffee)"
            aria-label="Expense description"
            required
          />
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            aria-label="Expense amount"
            min="0.01"
            step="0.01"
            required
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Expense category">
            <option value="Food">Food</option>
            <option value="Transport">Transport</option>
            <option value="Shopping">Shopping</option>
            <option value="Utilities">Utilities</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Other">Other</option>
          </select>
          <button type="submit">Add Expense</button>
        </form>
      </section>

      <section className="list-card">
        <h3>Your Expenses</h3>
        {expenses.length === 0 ? (
          <p className="empty-message">No expenses added yet.</p>
        ) : (
          <ul className="expense-list">
            {expenses.map((expense) => (
              <li key={expense.id} className="expense-item">
                <div className="expense-details">
                  <span className="expense-description">{expense.description}</span>
                  <span className="expense-category">{expense.category}</span>
                </div>
                <div className="expense-actions">
                  <span className="expense-amount">${expense.amount.toFixed(2)}</span>
                  <button onClick={() => handleDeleteExpense(expense.id)} className="delete-button" aria-label={`Delete ${expense.description}`}>&times;</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      
      <section className="insights-card">
        <h3>AI Financial Insights</h3>
         <div className="insights-container" aria-live="polite">
          {isLoading && (
            <div>
              <div className="spinner"></div>
              <p className="status-message">Analyzing your spending...</p>
            </div>
          )}
          {error && <p className="status-message error-message" role="alert">{error}</p>}
          {insights && <div className="insights-content">{renderInsights()}</div>}
          {!isLoading && !insights && !error && (
            <p className="status-message">Click the button to get AI-powered insights on your spending.</p>
          )}
        </div>
        <button 
          onClick={handleGetInsights} 
          className="insights-button" 
          disabled={isLoading || expenses.length === 0}
        >
          {isLoading ? 'Generating...' : 'Get Insights'}
        </button>
      </section>
    </main>
  );
};

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);