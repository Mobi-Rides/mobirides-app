#!/usr/bin/env node
/**
 * Script to fetch and display in-progress Linear issues.
 * Filters for issues with state "started", sorts by updatedAt descending,
 * and returns identifier, title, assignee name, and updatedAt.
 */

import { LinearClient } from '@linear/sdk';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const LINEAR_API_KEY = process.env.LINEAR_API_KEY;

if (!LINEAR_API_KEY) {
  console.error('Error: LINEAR_API_KEY environment variable is required.');
  process.exit(1);
}

const linearClient = new LinearClient({
  apiKey: LINEAR_API_KEY,
});

const fetchInProgressIssues = async () => {
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
      console.log('No in-progress issues found.');
      return;
    }

    console.log('\n=== In-Progress Issues (Started) ===\n');
    for (const issue of issues) {
      const assignee = await issue.assignee;
      const assigneeName = assignee?.name || 'Unassigned';
      console.log(
        `ID: ${issue.identifier}`,
        `| Title: ${issue.title}`,
        `| Assignee: ${assigneeName}`,
        `| Updated: ${new Date(issue.updatedAt).toLocaleString()}`
      );
    }
    console.log(`\nTotal: ${issues.length} in-progress issues found.`);
  } catch (error) {
    console.error('Error fetching issues:', error.message);
    process.exit(1);
  }
};

fetchInProgressIssues();