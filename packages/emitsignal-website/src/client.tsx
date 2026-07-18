import './lib/instrument-client';

import { StartClient } from '@tanstack/react-start/client';
import { hydrateRoot } from 'react-dom/client';

hydrateRoot(document, <StartClient />);
