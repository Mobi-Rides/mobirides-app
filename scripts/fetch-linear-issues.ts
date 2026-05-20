#!/usr/bin/env node
/**
 * Script to fetch and display in-progress Linear issues.
 * Filters for issues with state "started", sorts by updatedAt descending,
 * and returns identifier, title, assignee name, and updatedAt.
 */

import { LinearClient } from '@linear/sdk';
import dotenv from 'dotenv';

dotenv.config();

const LINEAR_API_KEY = process.env.LINEAR_API_KEY;

if (!LINEAR_API_KEY) {
  console.error('Error: LINEAR_API_KEY environment variable is required.');
  process.exit(1);
}

const linearClient = new LinearClient({
  apiKey: LINEAR_API_KEY,
});

interface IssueData {
  identifier: string;
  title: string;
  assigneeName?: string;
  updatedAt: string;
}

const fetchInProgressIssues = async (): Promise<IssueData[]> => {
  try {
    const issuesResponse = await linearClient.issues({
      filter: {
        state: {
          type: { eq: 'started' },
        },
      },
      first: 50,
    });

    const issues = issuesResponse.nodes;

    if (!issues || issues.length === 0) {
      return [];
    }

    return Promise.all(
      issues.map(async (issue) => {
        const assignee = await issue.assignee;
        return {
          identifier: issue.identifier,
          title: issue.title,
          assigneeName: assignee?.name,
          updatedAt: issue.updatedAt,
        };
      })
    );
  } catch (error) {
    console.error('Error fetching issues:', error instanceof Error ? error.message : String(error));
    throw error;
  }
};

const displayIssues = (issues: IssueData[]): void => {
  if (issues.length === 0) {
    console.log('No in-progress issues found.');
    return;
  }

  console.log('\n=== In-Progress Issues (Started) ===\n');
  issues.forEach((issue) => {
    const assigneeName = issue.assigneeName || 'Unassigned';
    console.log(
      `ID: ${issue.identifier}`,
      `| Title: ${issue.title}`,
      `| Assignee: ${assigneeName}`,
      `| Updated: ${new Date(issue.updatedAt).toLocaleString()}`
    );
  });
  console.log(`\nTotal: ${issues.length} in-progress issues found.`);
};

// Main execution
fetchInProgressIssues()
  .then(displayIssues)
  .catch((error) => {
    process.exit(1);
  });