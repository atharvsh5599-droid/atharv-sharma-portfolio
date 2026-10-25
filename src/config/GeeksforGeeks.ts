/*
 * GeeksforGeeks Activity Configuration
 *
 * Configuration for the GeeksforGeeks activity and contribution graph.
 */

export const gfgConfig = {
  username: 'as9817467007',
  profileUrl: 'https://www.geeksforgeeks.org/profile/as9817467007',
  apiUrl: '/api/gfg-activity',

  // Display settings
  title: 'GeeksforGeeks Activity',
  subtitle: 'problem-solving and practice over the past year',

  // Chart settings
  blockSize: 11,
  blockMargin: 3,
  fontSize: 12,
  maxLevel: 4,

  // Month labels
  months: [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ],

  // Weekday labels (empty for weekends, M for Monday, etc.)
  weekdays: ['', 'M', '', 'W', '', 'F', ''],

  // Total count label template
  totalCountLabel: '{{count}} problems solved in the last year',

  // Theme configuration for dark and light modes matching GeeksforGeeks green palette
  theme: {
    dark: [
      'rgb(22, 27, 34)', // Level 0: dark neutral empty block
      'rgb(14, 68, 41)', // Level 1: soft dark green
      'rgb(0, 109, 50)', // Level 2: medium green
      'rgb(47, 141, 70)', // Level 3: GeeksforGeeks brand green
      'rgb(57, 211, 83)', // Level 4: bright green
    ],
    light: [
      'rgb(235, 237, 240)', // Level 0: light gray empty block
      'rgb(187, 240, 197)', // Level 1: pale green
      'rgb(104, 211, 145)', // Level 2: light green
      'rgb(47, 141, 70)', // Level 3: GeeksforGeeks brand green
      'rgb(30, 95, 47)', // Level 4: deep green
    ],
  },

  // Error state configuration
  errorState: {
    title: 'Unable to load GeeksforGeeks activity',
    description:
      'Check out my profile directly on GeeksforGeeks for my latest problem-solving record.',
    buttonText: 'View on GeeksforGeeks',
  },

  // Loading state configuration
  loadingState: {
    title: 'Loading GeeksforGeeks activity...',
    description: 'Fetching verified practice and submission data',
  },
};
