import React from 'react';
import Card from '../components/Card';
import type { FirestoreCollection, FirestoreField } from '../types';
import { DbIcon } from '../components/icons';

const schema: FirestoreCollection[] = [
  {
    name: 'users',
    description: 'Stores core user profiles, authentication info, and roles.',
    fields: [
      { name: 'displayName', type: 'string', description: 'User\'s public name' },
      { name: 'email', type: 'string', description: 'Login email (private)' },
      { name: 'role', type: 'string', description: 'e.g., "user", "admin", "creator"' },
      { name: 'createdAt', type: 'timestamp', description: 'Account creation date' },
      { name: 'lastLogin', type: 'timestamp', description: 'Last active timestamp' },
    ],
    subcollections: [
      {
        name: 'notes',
        description: 'All notes created by the user across all content.',
        fields: [
          { name: 'contentId', type: 'reference', description: 'Pointer to course/book' },
          { name: 'text', type: 'string', description: 'The note content itself' },
          { name: 'tags', type: 'array', description: 'AI-generated tags' },
          { name: 'createdAt', type: 'timestamp', description: 'When the note was saved' },
        ],
      },
      {
        name: 'gamification',
        description: 'User-specific points, achievements, and streaks.',
        fields: [
            { name: 'points', type: 'number', description: 'Total accumulated points' },
            { name: 'streaks', type: 'map', description: 'Daily login streak info' },
            { name: 'achievements', type: 'array', description: 'List of earned achievement IDs' },
            { name: 'unlockedRewardIds', type: 'array', description: 'List of unlocked reward item IDs' },
        ],
      }
    ],
  },
  {
    name: 'content',
    description: 'A top-level collection to house all app content for easy management.',
    fields: [],
    subcollections: [
        {
            name: 'courses',
            description: 'Structured educational courses with lessons.',
            fields: [
              { name: 'title', type: 'string', description: 'Course title' },
              { name: 'description', type: 'string', description: 'What the course is about' },
              { name: 'author', type: 'string', description: 'Content creator' },
            ],
        },
        {
            name: 'books',
            description: 'ePubs and other readable materials.',
            fields: [
              { name: 'title', type: 'string', description: 'Book title' },
              { name: 'ePubUrl', type: 'string', description: 'Link to ePub file in Storage' },
            ],
            subcollections: [
                {
                    name: 'comments',
                    description: 'User comments for a specific book.',
                    fields: [
                        { name: 'authorId', type: 'reference', description: 'Ref to users/{uid}' },
                        { name: 'authorName', type: 'string', description: 'Denormalized author name for display' },
                        { name: 'text', type: 'string', description: 'The comment content' },
                        { name: 'createdAt', type: 'timestamp', description: 'When the comment was posted' },
                    ],
                }
            ]
        },
        {
            name: 'podcasts',
            description: 'Podcast episodes and their associated metadata.',
            fields: [
              { name: 'title', type: 'string', description: 'Episode title' },
              { name: 'audioUrl', type: 'string', description: 'Link to audio file in Storage' },
              { name: 'transcript', type: 'string', description: 'Full episode transcript' },
            ],
            subcollections: [
                {
                    name: 'comments',
                    description: 'User comments for a specific podcast episode.',
                    fields: [
                        { name: 'authorId', type: 'reference', description: 'Ref to users/{uid}' },
                        { name: 'authorName', type: 'string', description: 'Denormalized author name for display' },
                        { name: 'text', type: 'string', description: 'The comment content' },
                        { name: 'createdAt', type: 'timestamp', description: 'When the comment was posted' },
                    ],
                }
            ]
        },
        {
            name: 'rewards',
            description: 'Items available for purchase with points in the Gamification store.',
            fields: [
                { name: 'title', type: 'string', description: 'Name of the reward' },
                { name: 'description', type: 'string', description: 'What the user gets' },
                { name: 'cost', type: 'number', description: 'Points required to unlock' },
                { name: 'type', type: 'string', description: 'e.g., "content", "theme", "badge"' },
            ],
        }
    ]
  },
  {
    name: 'community',
    description: 'Holds all user-generated content for community features.',
    fields: [],
    subcollections: [
        {
            name: 'prayerWall',
            description: 'Posts for the community Prayer Wall.',
            fields: [
                { name: 'authorId', type: 'reference', description: 'Ref to users/{uid}' },
                { name: 'text', type: 'string', description: 'The prayer request content' },
                { name: 'isAnonymous', type: 'boolean', description: 'True if user posted anonymously' },
                { name: 'prayerCount', type: 'number', description: 'How many users prayed' },
            ],
        },
        {
            name: 'testimonies',
            description: 'User-submitted standalone stories of faith and gratitude, separate from answered prayers.',
            fields: [
                { name: 'authorId', type: 'reference', description: 'Ref to users/{uid}' },
                { name: 'title', type: 'string', description: 'Title of the testimony' },
                { name: 'text', type: 'string', description: 'The testimony content' },
            ],
        }
    ]
  }
];

const Field: React.FC<{ field: FirestoreField }> = ({ field }) => (
    <div className="grid grid-cols-3 gap-2 py-2 px-3 text-sm border-t border-brand-border">
        <span className="font-mono text-brand-text-primary">{field.name}</span>
        <span className="font-mono text-brand-accent">{field.type}</span>
        <span className="text-brand-text-secondary">{field.description}</span>
    </div>
);

const Collection: React.FC<{ collection: FirestoreCollection, level?: number }> = ({ collection, level = 0 }) => (
  <Card className="mb-6">
    <div className="mb-4">
        <h3 className="text-xl font-bold text-brand-text-primary flex items-center">
            <DbIcon className="w-6 h-6 mr-2 text-brand-text-secondary"/>
            <span className="font-mono">{collection.name}</span>
        </h3>
        <p className="text-brand-text-secondary ml-8">{collection.description}</p>
    </div>
    
    <div className="bg-brand-secondary rounded-lg overflow-hidden">
        <div className="grid grid-cols-3 gap-2 py-2 px-3 font-semibold text-xs text-brand-text-secondary uppercase tracking-wider">
            <span>Field Name</span>
            <span>Type</span>
            <span>Description</span>
        </div>
        {collection.fields.map(field => <Field key={field.name} field={field} />)}
        {collection.fields.length === 0 && <div className="text-center py-4 text-brand-text-secondary text-sm">No top-level fields</div>}
    </div>

    {collection.subcollections && collection.subcollections.length > 0 && (
        <div className="mt-4 pl-8 border-l-2 border-brand-accent/50">
            <h4 className="text-lg font-semibold text-brand-text-primary mb-2">Sub-collections</h4>
            {collection.subcollections.map(sub => <Collection key={sub.name} collection={sub} level={level + 1} />)}
        </div>
    )}
  </Card>
);


const DataArchitecture: React.FC = () => {
  return (
    <div>
      <h1 className="text-4xl font-bold text-brand-text-primary mb-2">Proposed Firestore Data Architecture</h1>
      <p className="text-lg text-brand-text-secondary mb-8">
        This is the proposed schema for our Firestore database. A clean structure is essential for performance, security, and future scalability.
      </p>
      {schema.map(collection => <Collection key={collection.name} collection={collection} />)}
    </div>
  );
};

export default DataArchitecture;