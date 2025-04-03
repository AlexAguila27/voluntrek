import React from 'react';
import { ExpandableCard, ExpandableCardContent, ExpandableCardFooter } from './expandable-card';

export default function ExpandableCardExample() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Expandable Card Examples</h2>
      
      {/* Basic Example */}
      <ExpandableCard title="Basic Example">
        <ExpandableCardContent>
          <p>This is a basic expandable card example. Click the header to expand or collapse.</p>
        </ExpandableCardContent>
      </ExpandableCard>
      
      {/* Example with Default Expanded */}
      <ExpandableCard title="Default Expanded Example" defaultExpanded={true}>
        <ExpandableCardContent>
          <p>This card is expanded by default when the component mounts.</p>
          <p className="mt-2">You can control the initial state with the defaultExpanded prop.</p>
        </ExpandableCardContent>
      </ExpandableCard>
      
      {/* Example with Footer */}
      <ExpandableCard title="Card with Footer">
        <ExpandableCardContent>
          <p>This card includes a footer section with action buttons.</p>
          <div className="mt-4 space-y-2">
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
              <h4 className="font-medium">Content Section</h4>
              <p className="text-sm text-gray-500">This is where your main content would go.</p>
            </div>
          </div>
        </ExpandableCardContent>
        <ExpandableCardFooter>
          <div className="flex justify-end space-x-2">
            <button className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-md text-sm">
              Cancel
            </button>
            <button className="px-3 py-1 bg-primary text-white rounded-md text-sm">
              Save
            </button>
          </div>
        </ExpandableCardFooter>
      </ExpandableCard>
      
      {/* Example with Complex Content */}
      <ExpandableCard title="Complex Content Example">
        <ExpandableCardContent>
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Detailed Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Field One</p>
                <p className="text-sm">Value One</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Field Two</p>
                <p className="text-sm">Value Two</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Field Three</p>
                <p className="text-sm">Value Three</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Field Four</p>
                <p className="text-sm">Value Four</p>
              </div>
            </div>
          </div>
        </ExpandableCardContent>
      </ExpandableCard>
    </div>
  );
}