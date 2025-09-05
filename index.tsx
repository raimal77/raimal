/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

interface Expense {
  id: number;
  description: string;
  amount: number;
  category: string;
}

const App: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [insights, setInsights] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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


  return (
    <main className="container">
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