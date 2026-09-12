-- Remove dummy topics from Unit 1
DELETE FROM topics
WHERE title IN (
  'Introduction to HTML',
  'HTML Elements and Attributes'
);

-- Unit 1 Topics
INSERT INTO topics (unit_id, topic_number, title, description) VALUES
(1, 1, 'Surface Observatory Network and Siting Standards', NULL),
(1, 2, 'Synoptic Meteorology Fundamentals', NULL),
(1, 3, 'IMD''s Climatological Data Archive and National Data Centre', NULL),
(1, 4, 'Principles of Radar Meteorology and the IMD DWR Network', NULL),
(1, 5, 'Cyclone Warning System and Area Cyclone Warning Centres', NULL);

-- Unit 2 Topics
INSERT INTO topics (unit_id, topic_number, title, description) VALUES
(2, 1, 'Data Digitization and Quality Control Procedures', NULL),
(2, 2, 'Conventional Meteorological Instruments', NULL),
(2, 3, 'Heat Wave and Cold Wave Warning Protocols', NULL),
(2, 4, 'Radar Hardware, Signal Processing and Calibration', NULL),
(2, 5, 'Numerical Weather Prediction Guidance', NULL);

-- Unit 3 Topics
INSERT INTO topics (unit_id, topic_number, title, description) VALUES
(3, 1, 'Interpreting Radar Products: Reflectivity, Velocity, PPI and RHI', NULL),
(3, 2, 'Common Alerting Protocol (CAP) and Multi-Channel Dissemination', NULL),
(3, 3, 'Nowcasting for Severe Weather', NULL),
(3, 4, 'Statistical Climatology: Normals, Anomalies and Trends', NULL),
(3, 5, 'Automatic Weather Stations and Automatic Rain Gauges', NULL);

-- Unit 4 Topics
INSERT INTO topics (unit_id, topic_number, title, description) VALUES
(4, 1, 'Coordination with NDMA, SDMA and District Administration', NULL),
(4, 2, 'Analysis of Extreme Weather Events', NULL),
(4, 3, 'Radar Data Quality Control', NULL),
(4, 4, 'Monsoon and Seasonal Forecasting', NULL),
(4, 5, 'Upper-Air Observations', NULL);

-- Unit 5 Topics
INSERT INTO topics (unit_id, topic_number, title, description) VALUES
(5, 1, 'Impact-Based Forecasting and Warning Communication', NULL),
(5, 2, 'Climate Data Products and User Services', NULL),
(5, 3, 'Forecast Verification and Communication', NULL),
(5, 4, 'Observation Coding, Recording and Quality Control: SYNOP/METAR', NULL),
(5, 5, 'Radar-Based Nowcasting of Thunderstorms and Hailstorms', NULL);