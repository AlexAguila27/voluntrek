# Expandable Card Component

The Expandable Card component is a flexible UI element that allows content to be shown or hidden with a simple click. It builds upon the existing Card component and adds expand/collapse functionality.

## Features

- Toggle content visibility with a click
- Smooth animation for expanding and collapsing
- Customizable with all the props from the base Card component
- Optional default expanded state
- Accessible with proper ARIA attributes

## Installation

No additional installation is required as this component uses the existing Card component and Lucide React icons that are already part of the project.

## Usage

```jsx
import { ExpandableCard, ExpandableCardContent, ExpandableCardFooter } from '@/components/ui/expandable-card';

// Basic usage
<ExpandableCard title="Card Title">
  <ExpandableCardContent>
    Your content here
  </ExpandableCardContent>
</ExpandableCard>

// With default expanded state
<ExpandableCard title="Card Title" defaultExpanded={true}>
  <ExpandableCardContent>
    This content will be visible by default
  </ExpandableCardContent>
</ExpandableCard>

// With footer
<ExpandableCard title="Card Title">
  <ExpandableCardContent>
    Main content
  </ExpandableCardContent>
  <ExpandableCardFooter>
    Footer content
  </ExpandableCardFooter>
</ExpandableCard>
```

## Props

### ExpandableCard

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| title | ReactNode | - | The title displayed in the card header |
| defaultExpanded | boolean | false | Whether the card is expanded by default |
| className | string | - | Additional CSS classes |
| children | ReactNode | - | Card content and footer |

### ExpandableCardContent

Accepts all props from the base CardContent component.

### ExpandableCardFooter

Accepts all props from the base CardFooter component.

## Examples

See `expandable-card-example.jsx` for more detailed usage examples.