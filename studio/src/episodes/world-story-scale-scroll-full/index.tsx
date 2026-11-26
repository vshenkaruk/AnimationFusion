import {defineStoryWorldEpisode, WorldTimeline} from '../../engine';
import * as opening from '../world-story-scale-scroll/shots';
import * as bedtime from './bedtime';
import * as school from './school-arc';
import * as finale from './finale';
import timeline from './timeline.json';

export const worldStoryScaleScrollFull = defineStoryWorldEpisode(
  'WorldStoryScaleScrollFull',
  timeline as unknown as WorldTimeline,
  {...opening, ...bedtime, ...school, ...finale},
);
