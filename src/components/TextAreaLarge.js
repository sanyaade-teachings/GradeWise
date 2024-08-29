import Form from 'react-bootstrap/Form';

function TextAreaLarge() {
  return (
    <Form>
      <Form.Group className="mb-3" controlId="exampleForm.ControlTextarea1">
        <Form.Label>Assignment Description</Form.Label>
        <Form.Control as="textarea" rows={5} />
      </Form.Group>
    </Form>
  );
}

export default TextAreaLarge;