-- Create schema for pipeline data
CREATE SCHEMA IF NOT EXISTS pipeline;

-- Create example tables for demonstration
CREATE TABLE IF NOT EXISTS pipeline.events (
    id SERIAL PRIMARY KEY,
    event_id UUID DEFAULT gen_random_uuid(),
    event_type VARCHAR(255) NOT NULL,
    data JSONB NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pipeline.transformations (
    id SERIAL PRIMARY KEY,
    source_event_id UUID NOT NULL,
    transformation_type VARCHAR(255) NOT NULL,
    input_data JSONB NOT NULL,
    output_data JSONB NOT NULL,
    transformation_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pipeline.outputs (
    id SERIAL PRIMARY KEY,
    output_id UUID DEFAULT gen_random_uuid(),
    source_transformation_id INTEGER REFERENCES pipeline.transformations(id),
    output_type VARCHAR(255) NOT NULL,
    data JSONB NOT NULL,
    destination VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_events_event_type ON pipeline.events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON pipeline.events(created_at);
CREATE INDEX IF NOT EXISTS idx_events_data_gin ON pipeline.events USING gin(data);
CREATE INDEX IF NOT EXISTS idx_transformations_source_event_id ON pipeline.transformations(source_event_id);
CREATE INDEX IF NOT EXISTS idx_outputs_status ON pipeline.outputs(status);
CREATE INDEX IF NOT EXISTS idx_outputs_output_type ON pipeline.outputs(output_type);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for events table
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON pipeline.events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();