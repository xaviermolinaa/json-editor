import { Injectable, signal } from '@angular/core';

export interface JsonSample {
  name: string;
  description: string;
  content: string;
}

@Injectable({
  providedIn: 'root',
})
export class SampleDataService {
  readonly samples: JsonSample[] = [
    {
      name: 'Valid JSON Sample',
      description: 'A simple valid JSON object',
      content: JSON.stringify(
        {
          name: 'John Doe',
          age: 30,
          email: 'john.doe@example.com',
          address: {
            street: '123 Main St',
            city: 'New York',
            country: 'USA',
          },
          hobbies: ['reading', 'gaming', 'coding'],
          isActive: true,
        },
        null,
        2
      ),
    },
    {
      name: 'Invalid JSON - Trailing Comma',
      description: 'JSON with a trailing comma (invalid in strict mode)',
      content: `{
  "name": "Jane Doe",
  "age": 25,
  "skills": ["JavaScript", "TypeScript", "Angular",],
  "certified": true,
}`,
    },
    {
      name: 'Large JSON Sample',
      description: 'A larger JSON to test size limitations',
      content: JSON.stringify(
        {
          users: Array.from({ length: 100 }, (_, i) => ({
            id: i + 1,
            username: `user${i + 1}`,
            email: `user${i + 1}@example.com`,
            profile: {
              firstName: `First${i + 1}`,
              lastName: `Last${i + 1}`,
              age: 20 + (i % 50),
              bio: `This is a bio for user ${i + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
            },
            settings: {
              theme: i % 2 === 0 ? 'dark' : 'light',
              notifications: {
                email: true,
                push: i % 3 === 0,
                sms: false,
              },
            },
            posts: Array.from({ length: 5 }, (_, j) => ({
              id: j + 1,
              title: `Post ${j + 1} by user ${i + 1}`,
              content: `This is the content of post ${j + 1}`,
              tags: ['tag1', 'tag2', 'tag3'],
              createdAt: new Date(2024, i % 12, j + 1).toISOString(),
            })),
          })),
          metadata: {
            totalUsers: 100,
            generatedAt: new Date().toISOString(),
            version: '1.0.0',
          },
        },
        null,
        2
      ),
    },
    {
      name: 'Invalid JSON - Syntax Error',
      description: 'JSON with a syntax error (missing quote)',
      content: `{
  "name": "Bob Smith,
  "role": "Developer",
  "active": true
}`,
    },
    {
      name: 'Deep Nesting Sample',
      description: 'JSON with deep nesting to test depth limits',
      content: JSON.stringify(
        {
          level1: {
            level2: {
              level3: {
                level4: {
                  level5: {
                    level6: {
                      level7: {
                        level8: {
                          level9: {
                            level10: {
                              data: 'Deep nested value',
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        null,
        2
      ),
    },
  ];

  getSample(index: number): JsonSample | null {
    return this.samples[index] ?? null;
  }
}
