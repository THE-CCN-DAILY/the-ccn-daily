import React from 'react';
import Card from '../Card';

const ReadingPlanReader: React.FC = () => {
  return (
    <Card>
      <h2 className="text-2xl font-bold text-brand-text-primary">Reading Plan Reader</h2>
      <p className="text-brand-text-secondary">This component will house the specific UI and logic for the reading plan viewer and tracker.</p>
    </Card>
  );
};

export default ReadingPlanReader;
