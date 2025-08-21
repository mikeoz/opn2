-- Add foreign key constraint for initiated_by column
ALTER TABLE family_unit_connections 
ADD CONSTRAINT fk_family_connections_initiated_by 
FOREIGN KEY (initiated_by) REFERENCES profiles(id);

-- Add foreign key constraint for approved_by column  
ALTER TABLE family_unit_connections 
ADD CONSTRAINT fk_family_connections_approved_by 
FOREIGN KEY (approved_by) REFERENCES profiles(id);