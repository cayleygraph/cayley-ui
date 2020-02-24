import React, { useState, useEffect } from "react";

import {
  getEntity,
  Entity as EntityData,
  isClass,
  isProperty,
  LabeledEntityValue
} from "./data";
import { isReference } from "./json-ld";
import Entity from "./Entity";
import Class from "./Class";
import Property from "./Property";
import NotFound from "./NotFound";
import useEntityID from "./useEntityID";

type Props = {
  serverURL: string;
  setError: (error: Error | null) => void;
  error: Error | null;
};

const EntityPage = ({ serverURL, setError, error }: Props) => {
  const [result, setResult] = useState<EntityData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const entityID = useEntityID();

  useEffect(() => {
    setError(null);
    setResult(null);

    if (entityID) {
      setLoading(true);
      getEntity(serverURL, entityID)
        .then(result => {
          setResult(result);
        })
        .catch(error => {
          setError(error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [entityID, serverURL, setResult, setError]);
  if (!entityID) {
    return null;
  }
  if (error) {
    return null;
  }
  /** @todo better loading */
  if (loading) {
    return <div>Loading...</div>;
  }
  if (result === null) {
    return <NotFound id={entityID} />;
  }
  if (hasPropertyType(result)) {
    return <Property id={entityID} data={result} />;
  }
  if (hasClassType(result)) {
    return (
      <Class
        serverURL={serverURL}
        onError={setError}
        id={entityID}
        data={result}
      />
    );
  }
  return <Entity id={entityID} data={result} />;
};

export default EntityPage;

function getTypeIDs(result: EntityData): Set<string> {
  const types = result["@type"]?.values || [];
  return new Set(
    types
      .filter((record): record is LabeledEntityValue => !Array.isArray(record))
      .map(record => record.value)
      .filter(isReference)
      .map(value => value["@id"])
  );
}

function hasClassType(result: EntityData): boolean {
  return isClass(getTypeIDs(result));
}

function hasPropertyType(result: EntityData): boolean {
  return isProperty(getTypeIDs(result));
}
